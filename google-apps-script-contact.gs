/**
 * Contact form -> Google Sheet ("Contact Me" tab)
 *
 * SETUP
 * 1. Open the spreadsheet:
 *    https://docs.google.com/spreadsheets/d/1vJGkkwuPfs-EwjYzier9WMGsw1lIWfJlVjqEoSDroH4/edit
 * 2. Make sure there is a tab named exactly: Contact Me
 *    (optional header row A1:D1 -> Timestamp | Name | Email | Message)
 * 3. Extensions -> Apps Script. Delete any code, paste ALL of this file, Save.
 * 4. Deploy -> New deployment -> type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Deploy, authorize, and COPY the "Web app" URL (ends with /exec).
 * 5. Put that URL in the site env var:  VITE_CONTACT_SHEET_URL
 *    (in .env locally and in Netlify -> Environment variables), then redeploy.
 */

var SHEET_ID = '1vJGkkwuPfs-EwjYzier9WMGsw1lIWfJlVjqEoSDroH4'
var TAB_NAME = 'Contact Me'

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB_NAME)
    if (!sheet) throw new Error('Tab "' + TAB_NAME + '" not found')
    var p = (e && e.parameter) || {}
    sheet.appendRow([new Date(), p.name || '', p.email || '', p.message || ''])
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

// Lets you open the /exec URL in a browser to confirm the deployment is live.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'contact-me' }))
    .setMimeType(ContentService.MimeType.JSON)
}
