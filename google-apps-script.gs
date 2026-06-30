const RESULTS_SHEET_NAME = 'Quiz Results';
const SCRIPT_VERSION = '2026-06-30-v3';

const RESULT_HEADERS = [
  'Date',
  'User Name',
  'Session ID',
  'Module ID',
  'Module Name',
  'Points',
  'Correct Answers',
  'Questions Answered',
  'Questions in Module',
  'Accuracy (%)',
  'Total Time (seconds)',
  'Average Time (seconds)',
  'Completed Module',
  'Answer Review (JSON)'
];

function formatResultDate(isoTimestamp) {
  if (!isoTimestamp) return '';
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return String(isoTimestamp);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'M/d/yyyy h:mm a');
}

function getUserName(result) {
  return result.userName
    || result.playerName
    || result.player
    || result.name
    || result.studentName
    || '';
}

function getPointsDisplay(result) {
  if (result.pointsDisplay) return result.pointsDisplay;

  const points = Number(result.points ?? result.score ?? 0);
  const maxPoints = Number(
    result.maxPoints
    || (result.totalQuestions ? result.totalQuestions * 10 : 0)
    || 0
  );

  return `${points}/${maxPoints}`;
}

function buildResultRow(result) {
  return [
    formatResultDate(result.timestamp),
    getUserName(result),
    result.sessionId || '',
    result.moduleId || '',
    result.moduleName || '',
    getPointsDisplay(result),
    result.correctAnswers ?? '',
    result.questionsAnswered ?? '',
    result.totalQuestions ?? '',
    Math.round(Number(result.accuracy) || 0),
    result.totalTimeSeconds ?? '',
    result.averageTimeSeconds ?? '',
    result.completedModule ?? '',
    JSON.stringify(result.answers || [])
  ];
}

function ensureHeaders(sheet) {
  const firstHeader = sheet.getRange(1, 1).getDisplayValue();
  if (firstHeader === RESULT_HEADERS[0]) return;

  // Sheet has data but no header row — insert headers above existing rows.
  if (sheet.getLastRow() > 0) {
    sheet.insertRowBefore(1);
  }

  sheet.getRange(1, 1, 1, RESULT_HEADERS.length).setValues([RESULT_HEADERS]);
}

function appendResultRow(sheet, row) {
  // appendRow is the most reliable way to write a full row.
  sheet.appendRow(row);
}

function parsePayload(event) {
  if (event && event.postData && event.postData.contents) {
    return JSON.parse(event.postData.contents);
  }
  if (event && event.parameter && event.parameter.payload) {
    return JSON.parse(event.parameter.payload);
  }
  throw new Error('Missing POST body.');
}

function doPost(event) {
  try {
    const payload = event && event.postData && event.postData.contents;
    if (!payload && !(event && event.parameter && event.parameter.payload)) {
      throw new Error('Missing POST body.');
    }

    const result = parsePayload(event);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(RESULTS_SHEET_NAME)
      || spreadsheet.insertSheet(RESULTS_SHEET_NAME);

    ensureHeaders(sheet);
    appendResultRow(sheet, buildResultRow(result));

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, version: SCRIPT_VERSION }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error), version: SCRIPT_VERSION }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Open the deployed web-app URL in a browser to confirm the script version.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      version: SCRIPT_VERSION,
      sheet: RESULTS_SHEET_NAME,
      columns: RESULT_HEADERS.length,
      headers: RESULT_HEADERS
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
