const Airtable = require('airtable');
require('dotenv').config();

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY,
});

const base = Airtable.base(process.env.AIRTABLE_BASE);
const table = base.table(process.env.AIRTABLE_TABLE);

exports.handler = async (event, context, callback) => {
  try {
    const records = await table
      .select({
        sort: [{ field: 'Time', direction: 'desc' }],
        filterByFormula: `
          DATETIME_DIFF(DATEADD(TODAY(),0,'d'),Time,'d')<=1
          `,
      })
      .firstPage();
    const formattedRecords = records.map((record) => ({
      notes: record.fields.Notes,
      pee: record.fields.Pee,
      poop: record.fields.Poop,
      time: record.fields.Time,
      accident: record.fields.Accident,
    }));
    return {
      statusCode: 200,
      body: JSON.stringify(formattedRecords),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        err: 'Error occurred while getting the history',
      }),
    };
  }
};
