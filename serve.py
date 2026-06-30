#!/usr/bin/env python3
"""Local dev server for Math Practice Lab with quiz admin API."""

import json
import os
import re
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
QUIZZES_DIR = os.path.join(ROOT, 'quizzes')
QUIZ_FILE_PATTERN = re.compile(r'^[a-zA-Z0-9_-]+\.md$')


class MathGameHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_get()
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_post()
            return
        self.send_error(405, 'Method Not Allowed')

    def handle_api_get(self):
        parsed = urlparse(self.path)

        if parsed.path == '/api/quiz-files':
            self.send_json({'files': list_quiz_files()})
            return

        if parsed.path.startswith('/api/quiz/'):
            filename = unquote(parsed.path[len('/api/quiz/'):])
            path = safe_quiz_path(filename)
            if not path:
                self.send_json({'error': 'Invalid quiz file name.'}, status=400)
                return
            if not os.path.isfile(path):
                self.send_json({'error': 'Quiz file not found.'}, status=404)
                return
            with open(path, 'r', encoding='utf-8') as handle:
                content = handle.read()
            self.send_json({'filename': filename, 'content': content})
            return

        self.send_json({'error': 'Not found.'}, status=404)

    def handle_api_post(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith('/api/quiz/'):
            self.send_json({'error': 'Not found.'}, status=404)
            return

        filename = unquote(parsed.path[len('/api/quiz/'):])
        path = safe_quiz_path(filename)
        if not path:
            self.send_json({'error': 'Invalid quiz file name.'}, status=400)
            return

        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length).decode('utf-8') if length else ''
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            self.send_json({'error': 'Request body must be JSON.'}, status=400)
            return

        content = payload.get('content')
        if not isinstance(content, str):
            self.send_json({'error': 'Missing string field "content".'}, status=400)
            return

        if filename != 'manifest.md' and '```json' not in content:
            self.send_json({'error': 'Quiz files must include a ```json config block.'}, status=400)
            return

        if filename != 'manifest.md':
            try:
                validate_quiz_config(content, filename)
            except ValueError as error:
                self.send_json({'error': str(error)}, status=400)
                return

        with open(path, 'w', encoding='utf-8') as handle:
            handle.write(content)

        self.send_json({'ok': True, 'filename': filename})

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        if str(args[0]).startswith('GET /api/') or str(args[0]).startswith('POST /api/'):
            super().log_message(format, *args)


def safe_quiz_path(filename):
    if not filename or not QUIZ_FILE_PATTERN.match(filename):
        return None
    path = os.path.join(QUIZZES_DIR, filename)
    if os.path.commonpath([QUIZZES_DIR, path]) != QUIZZES_DIR:
        return None
    return path


def extract_config_block(markdown):
    match = re.search(r'```(?:json|config)\s*\n([\s\S]*?)```', markdown)
    if not match:
        raise ValueError('No ```json config block found.')
    return match.group(1)


def validate_quiz_config(markdown, filename):
    config = json.loads(extract_config_block(markdown))
    if not isinstance(config, dict):
        raise ValueError('Config block must be a JSON object.')
    if not config.get('id'):
        raise ValueError('Config must include an "id".')
    if not config.get('generator'):
        raise ValueError('Config must include a "generator".')
    return config


def list_quiz_files():
    files = ['manifest.md']
    manifest_path = os.path.join(QUIZZES_DIR, 'manifest.md')
    if os.path.isfile(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as handle:
            markdown = handle.read()
        try:
            config = json.loads(extract_config_block(markdown))
            for filename in config.get('quizzes', []):
                if isinstance(filename, str) and filename not in files:
                    files.append(filename)
        except (ValueError, json.JSONDecodeError):
            pass

    for filename in sorted(os.listdir(QUIZZES_DIR)):
        if filename.endswith('.md') and filename not in files:
            files.append(filename)

    return files


def main():
    port = int(os.environ.get('PORT', '8000'))
    server = HTTPServer(('', port), MathGameHandler)
    print(f'Math Practice Lab running at http://localhost:{port}')
    print(f'Admin console: http://localhost:{port}/admin.html')
    server.serve_forever()


if __name__ == '__main__':
    main()
