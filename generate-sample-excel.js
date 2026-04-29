/**
 * Sample Excel Generator for PharmaMetrics
 * Run: node generate-sample-excel.js
 * Output: phar_sample_sales.xlsx
 */

import xlsx from 'xlsx';

const zones = ['Dhaka', 'Chittagong', 'Sylhet'];
const territories = {
    'Dhaka': ['Gulshan', 'Mirpur', 'Dhanmondi'],
    'Chittagong': ['Agrabad', 'Halishahar'],
    'Sylhet': ['Zindabazar', 'Ambarkhana'],
};
const salesManagers = {
    'Dhaka': 'Rahim Uddin',
    'Chittagong': 'Karim Ahmed',
    'Sylhet': 'Nasrin Begum',
};
const srs = {
    'Gulshan': 'Arif Hossain',
    'Mirpur': 'Belal Khan',
    'Dhanmondi': 'Champa Akter',
    'Agrabad': 'Dulal Roy',
    'Halishahar': 'Emon Das',
    'Zindabazar': 'Farhan Ali',
    'Ambarkhana': 'Gita Rani',
};
const shops = {
    'Arif Hossain': ['Al-Amin Pharmacy', 'Shefa Drug Store', 'Life Plus Medical'],
    'Belal Khan': ['City Pharma', 'New Health Point'],
    'Champa Akter': ['Dhanmondi Medical', 'Green Cross Pharmacy'],
    'Dulal Roy': ['Port City Drugs', 'Chittagong Pharmacy'],
    'Emon Das': ['Harbor Health', 'Marine Medical'],
    'Farhan Ali': ['Sylhet Shefa', 'Surma Pharmacy'],
    'Gita Rani': ['Hill View Medical', 'Ambar Drug House'],
};

const products = [
    { name: 'Amoxicillin 500mg', sku: 'AMOX-500', tier: 1, minPrice: 120, maxPrice: 150 },
    { name: 'Paracetamol 500mg', sku: 'PARA-500', tier: 1, minPrice: 30, maxPrice: 60 },
    { name: 'Cetirizine 10mg', sku: 'CETI-010', tier: 1, minPrice: 50, maxPrice: 80 },
    { name: 'Metformin 500mg', sku: 'METF-500', tier: 2, minPrice: 200, maxPrice: 280 },
    { name: 'Amlodipine 5mg', sku: 'AMLO-005', tier: 2, minPrice: 180, maxPrice: 250 },
    { name: 'Atorvastatin 20mg', sku: 'ATOR-020', tier: 2, minPrice: 300, maxPrice: 400 },
    { name: 'Insulin Glargine', sku: 'INSG-100', tier: 3, minPrice: 800, maxPrice: 1200 },
    { name: 'Trastuzumab 150mg', sku: 'TRAS-150', tier: 3, minPrice: 5000, maxPrice: 8000 },
];

const headers = ['Date', 'Zone', 'Territory', 'Sales Manager', 'Sales Representative', 'Shop Name', 'Product Name', 'Product SKU', 'Tier', 'Quantity', 'Unit Price'];

const rows = [headers];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate 3 months of data: 2024-02, 2024-03, 2024-04
const months = ['2024-02', '2024-03', '2024-04'];

for (const month of months) {
    const daysInMonth = month === '2024-02' ? 29 : 31;
    for (let d = 1; d <= daysInMonth; d += rand(1, 3)) {
        const day = String(d).padStart(2, '0');
        const date = `${month}-${day}`;
        const zone = randEl(zones);
        const terr = randEl(territories[zone]);
        const sm = salesManagers[zone];
        const sr = srs[terr];
        if (!sr) continue;
        const shopList = shops[sr] || [];
        const shop = randEl(shopList);
        const product = randEl(products);
        const qty = rand(5, 50);
        const price = rand(product.minPrice, product.maxPrice);

        rows.push([date, zone, terr, sm, sr, shop, product.name, product.sku, product.tier, qty, price]);
    }
}

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet(rows);

// Style column widths
ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 20 },
    { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 12 }
];

xlsx.utils.book_append_sheet(wb, ws, 'Sales Data');
xlsx.writeFile(wb, 'phar_sample_sales.xlsx');

console.log(`✅ Generated phar_sample_sales.xlsx with ${rows.length - 1} sales records across ${months.join(', ')}`);
console.log('Upload this file at http://localhost:5174/upload');
