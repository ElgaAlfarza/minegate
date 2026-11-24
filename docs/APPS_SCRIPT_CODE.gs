/**
 * =================================================================
 * MINEGATE - Google Apps Script Web App Gateway
 * Salin dan tempel SELURUH KODE INI ke editor Apps Script Anda:
 * Extensions (Ekstensi) > Apps Script > Kode.gs
 * =================================================================
 */

const SHEET_HEADERS = {
  vehicles: [
    'vehicle_id',
    'unit_code',
    'plate_number',
    'type',
    'brand_model',
    'owner_company',
    'status',
    'last_odometer',
    'created_at',
  ],
  drivers: [
    'driver_id',
    'name',
    'license_type',
    'company',
    'phone',
    'status',
    'created_at',
  ],
  gate_logs: [
    'log_id',
    'vehicle_id',
    'driver_id',
    'gate',
    'purpose',
    'destination',
    'time_in',
    'time_out',
    'odometer_in',
    'odometer_out',
    'status',
    'officer_id',
    'notes',
  ],
  users: [
    'user_id',
    'name',
    'username',
    'password_hash',
    'role',
    'status',
    'created_at',
  ],
};

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'MINEGATE Apps Script Gateway Active',
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // Validasi API Key dari Script Properties jika dikonfigurasi
    const configuredApiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (configuredApiKey && payload.apiKey !== configuredApiKey) {
      return responseJson({ success: false, error: 'Unauthorized: Invalid API key' });
    }

    const action = payload.action;

    if (action === 'ensureHeaders') {
      return handleEnsureHeaders(payload.sheet);
    }
    if (action === 'getRows') {
      return handleGetRows(payload.sheet);
    }
    if (action === 'appendRow') {
      return handleAppendRow(payload.sheet, payload.data);
    }
    if (action === 'updateRowById') {
      return handleUpdateRowById(payload.sheet, payload.idColumn, payload.id, payload.patch);
    }

    return responseJson({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return responseJson({ success: false, error: err.toString() });
  }
}

function handleEnsureHeaders(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  const expectedHeaders = SHEET_HEADERS[sheetName];

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(expectedHeaders);
  } else {
    const headers = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
    const isMatching = expectedHeaders.every((h, i) => headers[i] === h);
    if (!isMatching) {
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    }
  }

  return responseJson({ success: true });
}

function handleGetRows(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return responseJson({ success: true, data: [] });
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return responseJson({ success: true, data: [] });
  }

  const headers = values[0];
  const records = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row || row.every(function(c) { return c === ''; })) continue;

    const item = {};
    headers.forEach(function(h, colIdx) {
      let val = row[colIdx];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "GMT+8", "yyyy-MM-dd'T'HH:mm:ssXXX");
      }
      if (h.indexOf('odometer') !== -1 && val !== '') {
        const num = Number(val);
        item[h] = isNaN(num) ? 0 : num;
      } else {
        item[h] = val;
      }
    });
    records.push(item);
  }

  return responseJson({ success: true, data: records });
}

function handleAppendRow(sheetName, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  const expectedHeaders = SHEET_HEADERS[sheetName];

  if (!sheet) {
    handleEnsureHeaders(sheetName);
    sheet = ss.getSheetByName(sheetName);
  }

  const rowValues = expectedHeaders.map(function(key) {
    const val = data[key];
    return val !== undefined && val !== null ? val : '';
  });

  sheet.appendRow(rowValues);
  return responseJson({ success: true });
}

function handleUpdateRowById(sheetName, idColumn, id, patch) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return responseJson({ success: false, error: 'Sheet not found' });
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return responseJson({ success: false, error: 'No data' });
  }

  const headers = values[0];
  const idColIdx = headers.indexOf(idColumn);
  if (idColIdx === -1) {
    return responseJson({ success: false, error: 'ID column not found' });
  }

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idColIdx]) === String(id)) {
      const rowIndex = r + 1;
      headers.forEach(function(h, colIdx) {
        if (h in patch) {
          const val = patch[h];
          sheet.getRange(rowIndex, colIdx + 1).setValue(val !== undefined && val !== null ? val : '');
        }
      });
      return responseJson({ success: true, updated: true });
    }
  }

  return responseJson({ success: false, updated: false, error: 'Row not found' });
}

function responseJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
