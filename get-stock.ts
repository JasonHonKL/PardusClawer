const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=5d');
const data = await response.json();

console.log('Raw response:', JSON.stringify(data, null, 2));

const result = data.chart.result[0];
const meta = result.meta;
const quote = result.indicators.quote[0];
const timestamps = result.timestamp;

console.log('\nApple Inc. (AAPL) - Daily Stock Data');
console.log('=====================================\n');
console.log('Meta keys:', Object.keys(meta));
console.log('Quote keys:', Object.keys(quote));

// Get the most recent data point (last element)
const lastIndex = timestamps.length - 1;
const timestamp = timestamps[lastIndex];
const open = quote.open[lastIndex];
const high = quote.high[lastIndex];
const low = quote.low[lastIndex];
const close = quote.close[lastIndex];
const volume = quote.volume[lastIndex];

console.log('\n--- Most Recent Day ---');
console.log(`Date: ${new Date(timestamp * 1000).toLocaleDateString()}`);
console.log(`Open: $${open?.toFixed(2) || 'N/A'}`);
console.log(`High: $${high?.toFixed(2) || 'N/A'}`);
console.log(`Low: $${low?.toFixed(2) || 'N/A'}`);
console.log(`Close: $${close?.toFixed(2) || 'N/A'}`);
console.log(`Volume: ${volume?.toLocaleString() || 'N/A'}`);

if (meta.previousClose) {
  const change = close - meta.previousClose;
  const changePercent = (change / meta.previousClose) * 100;
  console.log(`Previous Close: $${meta.previousClose.toFixed(2)}`);
  console.log(`Change: $${change.toFixed(2)} (${changePercent.toFixed(2)}%)`);
}
