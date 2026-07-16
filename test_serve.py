"""Tests for serve.py local dev server and quiz admin API."""

import json
import os
import tempfile
import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO

import serve


class TestSafeQuizPath:
    """Tests for safe_quiz_path function."""

    def test_valid_filename(self):
        """Valid .md filename returns a path."""
        with patch.object(serve, 'QUIZZES_DIR', '/quizzes'):
            result = serve.safe_quiz_path('test.md')
            assert result == '/quizzes/test.md'

    def test_empty_filename_returns_none(self):
        """Empty filename returns None."""
        assert serve.safe_quiz_path('') is None
        assert serve.safe_quiz_path(None) is None

    def test_invalid_extension_returns_none(self):
        """Non-.md extension returns None."""
        assert serve.safe_quiz_path('test.txt') is None
        assert serve.safe_quiz_path('test.json') is None
        assert serve.safe_quiz_path('test') is None

    def test_path_traversal_returns_none(self):
        """Path traversal attempts return None."""
        assert serve.safe_quiz_path('../etc/passwd') is None
        assert serve.safe_quiz_path('..%2F..%2Fetc%2Fpasswd') is None
        assert serve.safe_quiz_path('/etc/passwd') is None

    def test_valid_filenames_with_special_chars(self):
        """Filenames with allowed special characters work."""
        with patch.object(serve, 'QUIZZES_DIR', '/quizzes'):
            assert serve.safe_quiz_path('test-quiz.md') == '/quizzes/test-quiz.md'
            assert serve.safe_quiz_path('test_quiz.md') == '/quizzes/test_quiz.md'
            assert serve.safe_quiz_path('Quiz123.md') == '/quizzes/Quiz123.md'

    def test_invalid_special_chars_return_none(self):
        """Filenames with disallowed characters return None."""
        assert serve.safe_quiz_path('test quiz.md') is None  # space
        assert serve.safe_quiz_path('test!quiz.md') is None  # exclamation
        assert serve.safe_quiz_path('test@quiz.md') is None  # at sign


class TestExtractConfigBlock:
    """Tests for extract_config_block function."""

    def test_extracts_json_block(self):
        """Extracts content from ```json block."""
        markdown = '''# Title

```json
{"id": "test", "generator": "arithmetic"}
```

More content.
'''
        result = serve.extract_config_block(markdown)
        assert '"id": "test"' in result
        assert '"generator": "arithmetic"' in result

    def test_extracts_config_block(self):
        """Extracts content from ```config block."""
        markdown = '''# Title

```config
{"id": "test"}
```
'''
        result = serve.extract_config_block(markdown)
        assert '"id": "test"' in result

    def test_raises_on_missing_block(self):
        """Raises ValueError when no config block found."""
        markdown = '# Just a title\n\nSome text.'
        with pytest.raises(ValueError, match='No .* config block found'):
            serve.extract_config_block(markdown)

    def test_extracts_first_block_only(self):
        """Extracts only the first config block."""
        markdown = '''
```json
{"first": true}
```

```json
{"second": true}
```
'''
        result = serve.extract_config_block(markdown)
        assert '"first": true' in result
        assert 'second' not in result


class TestValidateQuizConfig:
    """Tests for validate_quiz_config function."""

    def test_valid_config(self):
        """Valid config with id and generator passes."""
        markdown = '''
```json
{
    "id": "test-quiz",
    "generator": "arithmetic"
}
```
'''
        config = serve.validate_quiz_config(markdown, 'test.md')
        assert config['id'] == 'test-quiz'
        assert config['generator'] == 'arithmetic'

    def test_missing_id_raises(self):
        """Missing id raises ValueError."""
        markdown = '```json\n{"generator": "arithmetic"}\n```'
        with pytest.raises(ValueError, match='must include an "id"'):
            serve.validate_quiz_config(markdown, 'test.md')

    def test_missing_generator_raises(self):
        """Missing generator raises ValueError."""
        markdown = '```json\n{"id": "test"}\n```'
        with pytest.raises(ValueError, match='must include a "generator"'):
            serve.validate_quiz_config(markdown, 'test.md')

    def test_non_object_config_raises(self):
        """Non-object config raises ValueError."""
        markdown = '```json\n["array", "not", "object"]\n```'
        with pytest.raises(ValueError, match='must be a JSON object'):
            serve.validate_quiz_config(markdown, 'test.md')

    def test_invalid_json_raises(self):
        """Invalid JSON raises json.JSONDecodeError."""
        markdown = '```json\n{invalid json}\n```'
        with pytest.raises(json.JSONDecodeError):
            serve.validate_quiz_config(markdown, 'test.md')


class TestListQuizFiles:
    """Tests for list_quiz_files function."""

    def test_returns_manifest_first(self):
        """Manifest.md is always first in the list."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create manifest
            manifest_path = os.path.join(tmpdir, 'manifest.md')
            with open(manifest_path, 'w') as f:
                f.write('```json\n{"quizzes": []}\n```')

            with patch.object(serve, 'QUIZZES_DIR', tmpdir):
                files = serve.list_quiz_files()
                assert files[0] == 'manifest.md'

    def test_includes_files_from_manifest(self):
        """Files listed in manifest appear in order."""
        with tempfile.TemporaryDirectory() as tmpdir:
            manifest_path = os.path.join(tmpdir, 'manifest.md')
            with open(manifest_path, 'w') as f:
                f.write('```json\n{"quizzes": ["first.md", "second.md"]}\n```')

            with patch.object(serve, 'QUIZZES_DIR', tmpdir):
                files = serve.list_quiz_files()
                assert 'first.md' in files
                assert 'second.md' in files
                assert files.index('first.md') < files.index('second.md')

    def test_includes_unlisted_files(self):
        """Files not in manifest are still included (sorted)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create manifest without listing extra.md
            manifest_path = os.path.join(tmpdir, 'manifest.md')
            with open(manifest_path, 'w') as f:
                f.write('```json\n{"quizzes": []}\n```')

            # Create extra unlisted file
            extra_path = os.path.join(tmpdir, 'extra.md')
            with open(extra_path, 'w') as f:
                f.write('# Extra quiz')

            with patch.object(serve, 'QUIZZES_DIR', tmpdir):
                files = serve.list_quiz_files()
                assert 'extra.md' in files

    def test_handles_missing_manifest(self):
        """Works when manifest.md doesn't exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            quiz_path = os.path.join(tmpdir, 'quiz.md')
            with open(quiz_path, 'w') as f:
                f.write('# Quiz')

            with patch.object(serve, 'QUIZZES_DIR', tmpdir):
                files = serve.list_quiz_files()
                assert 'manifest.md' in files  # Still included even if missing
                assert 'quiz.md' in files

    def test_handles_invalid_manifest(self):
        """Gracefully handles invalid manifest JSON."""
        with tempfile.TemporaryDirectory() as tmpdir:
            manifest_path = os.path.join(tmpdir, 'manifest.md')
            with open(manifest_path, 'w') as f:
                f.write('No JSON block here')

            with patch.object(serve, 'QUIZZES_DIR', tmpdir):
                files = serve.list_quiz_files()
                assert 'manifest.md' in files


class TestQuizFilePattern:
    """Tests for QUIZ_FILE_PATTERN regex."""

    def test_valid_patterns(self):
        """Valid quiz filenames match the pattern."""
        valid = [
            'test.md', 'quiz.md', 'multiplication.md',
            'test-quiz.md', 'test_quiz.md',
            'Quiz123.md', 'a.md', 'A.md',
            'abc-123_XYZ.md'
        ]
        for filename in valid:
            assert serve.QUIZ_FILE_PATTERN.match(filename), f'{filename} should match'

    def test_invalid_patterns(self):
        """Invalid quiz filenames don't match the pattern."""
        invalid = [
            '', 'test', '.md', 'test.txt',
            'test quiz.md', '../test.md',
            'test.md.bak', 'test.MD'  # uppercase extension
        ]
        for filename in invalid:
            assert not serve.QUIZ_FILE_PATTERN.match(filename), f'{filename} should not match'


class TestMathGameHandlerSendJson:
    """Tests for MathGameHandler.send_json method."""

    def test_send_json_200(self):
        """send_json sends correct status and content type."""
        handler = MagicMock(spec=serve.MathGameHandler)
        handler.wfile = BytesIO()

        serve.MathGameHandler.send_json(handler, {'key': 'value'})

        handler.send_response.assert_called_once_with(200)
        handler.send_header.assert_any_call('Content-Type', 'application/json; charset=utf-8')
        handler.end_headers.assert_called_once()

    def test_send_json_custom_status(self):
        """send_json respects custom status codes."""
        handler = MagicMock(spec=serve.MathGameHandler)
        handler.wfile = BytesIO()

        serve.MathGameHandler.send_json(handler, {'error': 'Not found'}, status=404)

        handler.send_response.assert_called_once_with(404)


class TestIntegration:
    """Integration tests using temporary quiz files."""

    @pytest.fixture
    def quiz_dir(self):
        """Create a temporary quiz directory with test files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create manifest
            manifest = os.path.join(tmpdir, 'manifest.md')
            with open(manifest, 'w') as f:
                f.write('''# Manifest
```json
{
    "quizzes": ["arithmetic.md"]
}
```
''')

            # Create arithmetic quiz
            arithmetic = os.path.join(tmpdir, 'arithmetic.md')
            with open(arithmetic, 'w') as f:
                f.write('''# Arithmetic
```json
{
    "id": "arithmetic",
    "generator": "arithmetic",
    "operations": ["multiply"]
}
```
''')

            yield tmpdir

    def test_full_file_listing_flow(self, quiz_dir):
        """Test complete flow of listing quiz files."""
        with patch.object(serve, 'QUIZZES_DIR', quiz_dir):
            files = serve.list_quiz_files()

            assert 'manifest.md' in files
            assert 'arithmetic.md' in files
            assert files.index('manifest.md') == 0

    def test_full_validation_flow(self, quiz_dir):
        """Test complete flow of reading and validating a quiz."""
        quiz_path = os.path.join(quiz_dir, 'arithmetic.md')
        with open(quiz_path, 'r') as f:
            content = f.read()

        config = serve.validate_quiz_config(content, 'arithmetic.md')
        assert config['id'] == 'arithmetic'
        assert config['generator'] == 'arithmetic'


class TestApiHandlers:
    """HTTP API handler tests against a temporary quizzes directory."""

    @pytest.fixture
    def api_env(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            manifest = os.path.join(tmpdir, 'manifest.md')
            with open(manifest, 'w', encoding='utf-8') as handle:
                handle.write('```json\n{"quizzes": ["arithmetic.md"]}\n```\n')

            arithmetic = os.path.join(tmpdir, 'arithmetic.md')
            with open(arithmetic, 'w', encoding='utf-8') as handle:
                handle.write(
                    '# Arithmetic\n'
                    '```json\n'
                    '{"id": "arithmetic", "generator": "arithmetic"}\n'
                    '```\n'
                )

            with patch.object(serve, 'QUIZZES_DIR', tmpdir), \
                    patch.object(serve, 'ROOT', tmpdir):
                yield tmpdir

    def _make_handler(self, path, method='GET', body=b''):
        handler = serve.MathGameHandler.__new__(serve.MathGameHandler)
        handler.path = path
        handler.headers = {'Content-Length': str(len(body))}
        handler.rfile = BytesIO(body)
        handler.wfile = BytesIO()
        handler.send_response = MagicMock()
        handler.send_header = MagicMock()
        handler.end_headers = MagicMock()
        handler.send_error = MagicMock()
        return handler

    def _read_json(self, handler):
        return json.loads(handler.wfile.getvalue().decode('utf-8'))

    def test_get_quiz_files(self, api_env):
        handler = self._make_handler('/api/quiz-files')
        serve.MathGameHandler.handle_api_get(handler)
        assert handler.send_response.call_args[0][0] == 200
        data = self._read_json(handler)
        assert 'manifest.md' in data['files']
        assert 'arithmetic.md' in data['files']

    def test_get_quiz_content(self, api_env):
        handler = self._make_handler('/api/quiz/arithmetic.md')
        serve.MathGameHandler.handle_api_get(handler)
        assert handler.send_response.call_args[0][0] == 200
        data = self._read_json(handler)
        assert data['filename'] == 'arithmetic.md'
        assert '```json' in data['content']

    def test_get_quiz_not_found(self, api_env):
        handler = self._make_handler('/api/quiz/missing.md')
        serve.MathGameHandler.handle_api_get(handler)
        assert handler.send_response.call_args[0][0] == 404
        assert self._read_json(handler)['error'] == 'Quiz file not found.'

    def test_get_quiz_invalid_name(self, api_env):
        handler = self._make_handler('/api/quiz/not%20valid.txt')
        serve.MathGameHandler.handle_api_get(handler)
        assert handler.send_response.call_args[0][0] == 400

    def test_get_unknown_api(self, api_env):
        handler = self._make_handler('/api/unknown')
        serve.MathGameHandler.handle_api_get(handler)
        assert handler.send_response.call_args[0][0] == 404

    def test_post_save_quiz(self, api_env):
        content = (
            '# Updated\n'
            '```json\n'
            '{"id": "arithmetic", "generator": "arithmetic", "maxProblems": 5}\n'
            '```\n'
        )
        body = json.dumps({'content': content}).encode('utf-8')
        handler = self._make_handler('/api/quiz/arithmetic.md', method='POST', body=body)
        serve.MathGameHandler.handle_api_post(handler)
        assert handler.send_response.call_args[0][0] == 200
        assert self._read_json(handler) == {'ok': True, 'filename': 'arithmetic.md'}

        with open(os.path.join(api_env, 'arithmetic.md'), encoding='utf-8') as handle:
            assert 'maxProblems' in handle.read()

    def test_post_rejects_missing_json_block(self, api_env):
        body = json.dumps({'content': '# No config'}).encode('utf-8')
        handler = self._make_handler('/api/quiz/arithmetic.md', body=body)
        serve.MathGameHandler.handle_api_post(handler)
        assert handler.send_response.call_args[0][0] == 400
        assert '```json' in self._read_json(handler)['error']

    def test_post_rejects_invalid_config(self, api_env):
        body = json.dumps({
            'content': '```json\n{"id": "missing-generator"}\n```\n'
        }).encode('utf-8')
        handler = self._make_handler('/api/quiz/arithmetic.md', body=body)
        serve.MathGameHandler.handle_api_post(handler)
        assert handler.send_response.call_args[0][0] == 400
        assert 'generator' in self._read_json(handler)['error']

    def test_post_rejects_non_json_body(self, api_env):
        handler = self._make_handler('/api/quiz/arithmetic.md', body=b'not-json')
        serve.MathGameHandler.handle_api_post(handler)
        assert handler.send_response.call_args[0][0] == 400
        assert 'JSON' in self._read_json(handler)['error']

    def test_post_allows_manifest_without_generator(self, api_env):
        content = '```json\n{"quizzes": ["arithmetic.md"]}\n```\n'
        body = json.dumps({'content': content}).encode('utf-8')
        handler = self._make_handler('/api/quiz/manifest.md', body=body)
        serve.MathGameHandler.handle_api_post(handler)
        assert handler.send_response.call_args[0][0] == 200


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
