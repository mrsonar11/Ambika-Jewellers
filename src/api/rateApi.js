import axios from './axiosConfig';

export const getTodayRates = async () => {
    const res = await axios.get('/rates/today');
    return res.data;
};

export const saveRates = async (rates) => {
    const res = await axios.post('/rates', { rates });
    return res.data;
};