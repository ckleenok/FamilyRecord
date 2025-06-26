import React, { useState, useEffect } from 'react';
import RecordTable from './components/RecordTable';
import './App.css';

const DEFAULT_CATEGORIES = [
  { name: '운동', color: '#FFDDC1' },
  { name: '독서', color: '#FFFACD' },
  { name: '공부', color: '#D4EDDA' },
  { name: '폰사용 2시간 미만', color: '#D1E7DD' }
];

const getRecentMonths = (count = 6) => {
  const arr = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    arr.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return arr.reverse();
};

const RECENT_MONTHS = getRecentMonths(6);
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

function App() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [resetKey, setResetKey] = useState(0);

  const isCurrentMonth = year === CURRENT_YEAR && month === CURRENT_MONTH;
  const daysInMonth = new Date(year, month, 0).getDate();

  const getThreeMonthAverage = (category, name) => {
    let totalScore = 0;
    for (let i = 0; i < 3; i++) {
      const d = new Date(year, month - 1 - i, 1);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth() + 1;
      
      const savedData = localStorage.getItem(`daily-record-${targetYear}-${targetMonth}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.records) {
          let monthScore = 0;
          const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
          for (let day = 1; day <= daysInTargetMonth; day++) {
            const key = `${parsed.categories.find((c, idx) => DEFAULT_CATEGORIES[idx].name === category) || category}-${name}-${day}`;
            if (parsed.records[key] === 'O') {
              monthScore++;
            }
          }
          totalScore += monthScore;
        }
      }
    }
    return (totalScore / 3).toFixed(1);
  };

  const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const displayDate = `${MONTH_NAMES[month - 1]} ${year}`;

  useEffect(() => {
    localStorage.setItem('dailyRecord-year', year);
  }, [year]);

  useEffect(() => {
    localStorage.setItem('dailyRecord-month', month);
  }, [month]);

  const renderMonthTable = () => {
    const rows = [];
    for (let i = 0; i < 2; i++) {
      rows.push(
        <tr key={i}>
          {RECENT_MONTHS.slice(i * 3, i * 3 + 3).map(({ year: y, month: m }) => (
            <td key={y + '-' + m} className="month-cell">
              <button
                onClick={() => { setYear(y); setMonth(m); }}
                className={year === y && month === m ? 'active' : ''}
              >
                {MONTH_NAMES[m - 1]}/{y}
              </button>
            </td>
          ))}
        </tr>
      );
    }
    return (
      <table className="month-selector"><tbody>{rows}</tbody></table>
    );
  };

  return (
    <div className="app-container">
      <h1>우리 집 생활 기록표</h1>
      
      <h2>{displayDate}</h2>
      <RecordTable key={resetKey} year={year} month={month} editable={isCurrentMonth} daysInMonth={daysInMonth} getThreeMonthAverage={getThreeMonthAverage} />

      <div style={{ marginTop: '40px' }}>
        {renderMonthTable()}
      </div>
    </div>
  )
}

export default App;
