
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  TextField, Button, Grid2, Typography, Switch, FormControlLabel, useMediaQuery,
  CssBaseline, Container, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const API_KEY = '18ET5W8NF3FGTBGZ'; // Replace with your Alpha Vantage API key

function App() {
  const [stocks, setStocks] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [chartData, setChartData] = useState({});
  const [darkMode, setDarkMode] = useState(true);

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: darkMode ? '#90caf9' : '#1976d2',
          },
          secondary: {
            main: darkMode ? '#f48fb1' : '#dc004e',
          },
        },
      }),
    [darkMode]
  );

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c'];

  const fetchStockData = async () => {
    try {
      const response = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`);
      const timeSeries = response.data['Time Series (Daily)'];
      
      if (timeSeries) {
        const filteredData = Object.entries(timeSeries)
          .filter(([date]) => {
            const currentDate = dayjs(date);
            return currentDate.isAfter(startDate) && currentDate.isBefore(endDate);
          })
          .map(([date, values]) => ({
            date,
            [symbol]: parseFloat(values['4. close']),
            [`${symbol}_volume`]: parseInt(values['5. volume'])
          }))
          .reverse();

        setChartData(prevChartData => {
          const newChartData = { ...prevChartData };
          filteredData.forEach(item => {
            if (newChartData[item.date]) {
              newChartData[item.date] = { ...newChartData[item.date], ...item };
            } else {
              newChartData[item.date] = item;
            }
          });
          return newChartData;
        });

        const latestData = filteredData[filteredData.length - 1];
        const earliestData = filteredData[0];
        const change = latestData[symbol] - earliestData[symbol];
        const changePercent = (change / earliestData[symbol]) * 100;

        setStocks(prevStocks => [
          ...prevStocks.filter(stock => stock.symbol !== symbol),
          {
            symbol,
            price: latestData[symbol].toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2) + '%',
            volume: latestData[`${symbol}_volume`]
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  const removeStock = (symbolToRemove) => {
    setStocks(prevStocks => prevStocks.filter(stock => stock.symbol !== symbolToRemove));
    setChartData(prevChartData => {
      const newChartData = { ...prevChartData };
      Object.keys(newChartData).forEach(date => {
        delete newChartData[date][symbolToRemove];
        delete newChartData[date][`${symbolToRemove}_volume`];
      });
      return newChartData;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth="lg" className="App" style={{ padding: '20px' }}>
          <Typography variant="h3" gutterBottom>
            Stock Market Dashboard
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                color="primary"
              />
            }
            label="Dark Mode"
          />
          <Grid2 container spacing={2} alignItems="center" style={{ marginTop: '20px', marginBottom: '20px' }}>
            <Grid2 item xs={12} sm={3}>
              <TextField
                label="Enter stock symbol"
                variant="outlined"
                fullWidth
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </Grid2>
            <Grid2 item xs={12} sm={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid2>
            <Grid2 item xs={12} sm={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid2>
            <Grid2 item xs={12} sm={3}>
              <Button variant="contained" onClick={fetchStockData} fullWidth>
                Add Stock Data
              </Button>
            </Grid2>
          </Grid2>

          {Object.keys(chartData).length > 0 && (
            <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
              <Typography variant="h5" gutterBottom>
                Stock Price Chart
              </Typography>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Object.values(chartData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    {stocks.map((stock, index) => (
                      <Line 
                        key={stock.symbol}
                        type="monotone"
                        dataKey={stock.symbol}
                        stroke={colors[index % colors.length]}
                        yAxisId="left"
                      />
                    ))}
                    {stocks.map((stock, index) => (
                      <Line 
                        key={`${stock.symbol}_volume`}
                        type="monotone"
                        dataKey={`${stock.symbol}_volume`}
                        stroke={colors[(index + 2) % colors.length]}
                        yAxisId="right"
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          )}

          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Change</TableCell>
                  <TableCell>Change Percent</TableCell>
                  <TableCell>Volume</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell>{stock.symbol}</TableCell>
                    <TableCell>{stock.price}</TableCell>
                    <TableCell>{stock.change}</TableCell>
                    <TableCell>{stock.changePercent}</TableCell>
                    <TableCell>{stock.volume}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => removeStock(stock.symbol)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;