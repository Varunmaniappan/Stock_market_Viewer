
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  TextField, Button, Grid2, Typography, Switch, FormControlLabel, useMediaQuery,
  CssBaseline, Container
} from '@mui/material';
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
  const [chartData, setChartData] = useState([]);
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
            price: parseFloat(values['4. close'])
          }))
          .reverse();

        setChartData(filteredData);

        const latestData = filteredData[filteredData.length - 1];
        const earliestData = filteredData[0];
        const change = latestData.price - earliestData.price;
        const changePercent = (change / earliestData.price) * 100;

        setStocks([{
          symbol,
          price: latestData.price.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2) + '%'
        }]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
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
                Fetch Stock Data
              </Button>
            </Grid2>
          </Grid2>

          {chartData.length > 0 && (
            <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
              <Typography variant="h5" gutterBottom>
                Stock Price Chart
              </Typography>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke={theme.palette.primary.main} />
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
                </TableRow>
              </TableHead>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell>{stock.symbol}</TableCell>
                    <TableCell>{stock.price}</TableCell>
                    <TableCell>{stock.change}</TableCell>
                    <TableCell>{stock.changePercent}</TableCell>
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