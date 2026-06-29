const RESULTS_SHEET_NAME = 'Quiz Results';

function doPost(event) {
  const result = JSON.parse(event.postData.contents);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(RESULTS_SHEET_NAME)
    || spreadsheet.insertSheet(RESULTS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Session ID',
      'Player',
      'Module ID',
      'Module',
      'Score',
      'Correct Answers',
      'Questions Answered',
      'Questions in Module',
      'Accuracy',
      'Total Time (seconds)',
      'Average Time (seconds)',
      'Completed Module',
      'Answer Review (JSON)'
    ]);
  }

  sheet.appendRow([
    result.timestamp,
    result.sessionId,
    result.playerName || result.player || result.name || result.studentName,
    result.moduleId,
    result.moduleName,
    result.score,
    result.correctAnswers,
    result.questionsAnswered,
    result.totalQuestions,
    result.accuracy,
    result.totalTimeSeconds,
    result.averageTimeSeconds,
    result.completedModule,
    JSON.stringify(result.answers || [])
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
