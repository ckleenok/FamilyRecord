import React, { useState, useEffect } from 'react';
import './RecordTable.css';

const DEFAULT_CATEGORIES = [
  { name: '운동', color: '#FFDDC1' },
  { name: '독서', color: '#FFFACD' },
  { name: '공부', color: '#D4EDDA' },
  { name: '폰사용 2시간 미만', color: '#D1E7DD' }
];

const NAMES = ['CK', 'Ella', 'Mark', 'Sally'];

const RecordTable = ({ year, month, editable, daysInMonth, getThreeMonthAverage }) => {
  const getInitialState = () => {
    const savedData = localStorage.getItem(`daily-record-${year}-${month}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Ensure all keys exist to prevent errors
      return {
        records: parsed.records || {},
        categories: parsed.categories || DEFAULT_CATEGORIES.map(c => c.name),
        categoryInputs: parsed.categoryInputs || DEFAULT_CATEGORIES.map(c => c.name),
        categoryFixed: parsed.categoryFixed || Array(DEFAULT_CATEGORIES.length).fill(true),
        editMode: parsed.editMode || Array(DEFAULT_CATEGORIES.length).fill(false),
      };
    }
    return {
      records: {},
      categories: DEFAULT_CATEGORIES.map(c => c.name),
      categoryInputs: DEFAULT_CATEGORIES.map(c => c.name),
      categoryFixed: DEFAULT_CATEGORIES.map(() => true),
      editMode: DEFAULT_CATEGORIES.map(() => false),
    };
  };

  const [records, setRecords] = useState(getInitialState().records);
  const [categories, setCategories] = useState(getInitialState().categories);
  const [categoryInputs, setCategoryInputs] = useState(getInitialState().categoryInputs);
  const [categoryFixed, setCategoryFixed] = useState(getInitialState().categoryFixed);
  const [editMode, setEditMode] = useState(getInitialState().editMode);

  const isCellEditable = (day, categoryIndex) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(year, month - 1, day);

    if (cellDate > today) return false;

    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = cellDate.getTime() === today.getTime();
    const isYesterday = cellDate.getTime() === yesterday.getTime();
    const isReadingCategory = categoryIndex === 1; // '독서' is the 2nd category (index 1)

    if (isReadingCategory) {
      return isToday || isYesterday;
    }

    return isToday;
  };

  useEffect(() => {
    const state = getInitialState();
    setRecords(state.records);
    setCategories(state.categories);
    setCategoryInputs(state.categoryInputs);
    setCategoryFixed(state.categoryFixed);
    setEditMode(state.editMode);
  }, [year, month]);

  useEffect(() => {
    const dataToSave = JSON.stringify({
      records,
      categories,
      categoryInputs,
      categoryFixed,
      editMode
    });
    localStorage.setItem(`daily-record-${year}-${month}`, dataToSave);
  }, [records, categories, categoryInputs, categoryFixed, editMode, year, month]);

  // O 개수 집계 함수
  const countO = (cat, name) => {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (records[`${cat}-${name}-${day}`] === 'O') count++;
    }
    return count;
  };

  // 카테고리 이름 수정 모드 진입
  const handleEdit = idx => {
    if (!editable) return;
    setEditMode(editMode.map((v, i) => i === idx ? true : v));
    setCategoryFixed(categoryFixed.map((v, i) => i === idx ? false : v));
  };

  // 카테고리 이름 입력값 변경
  const handleInputChange = (idx, value) => {
    setCategoryInputs(categoryInputs.map((v, i) => i === idx ? value : v));
  };

  // 카테고리 이름 저장
  const handleSave = idx => {
    setCategories(categories.map((v, i) => i === idx ? categoryInputs[idx] : v));
    setCategoryFixed(categoryFixed.map((v, i) => i === idx ? true : v));
    setEditMode(editMode.map((v, i) => i === idx ? false : v));
  };

  const handleCellClick = (categoryName, name, day, categoryIndex) => {
    if (!editable) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(year, month - 1, day);

    if (cellDate > today) {
      alert('미래 날짜는 기록할 수 없습니다.');
      return;
    }
    
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = cellDate.getTime() === today.getTime();
    const isYesterday = cellDate.getTime() === yesterday.getTime();
    const isReadingCategory = categoryIndex === 1;

    if (isReadingCategory) {
      if (!isToday && !isYesterday) {
        alert('독서는 오늘과 어제 날짜만 기록할 수 있습니다.');
        return;
      }
    } else {
      if (!isToday) {
        alert('오늘 날짜만 기록할 수 있습니다.');
        return;
      }
    }
    
    const key = `${categoryName}-${name}-${day}`;
    setRecords(prevRecords => {
      const newRecords = { ...prevRecords };
      if (newRecords[key] === 'O') {
        newRecords[key] = 'X';
      } else if (newRecords[key] === 'X') {
        delete newRecords[key];
      } else {
        newRecords[key] = 'O';
      }
      return newRecords;
    });
  };

  return (
    <table>
      <thead>
        <tr>
          <th>종목</th>
          <th>이름</th>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
            <th key={day}>{day}</th>
          ))}
          <th>점수</th>
          <th>3개월 평균</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((cat, catIdx) => (
          NAMES.map((name, nameIndex) => (
            <tr key={`${cat}-${name}`} style={{ backgroundColor: DEFAULT_CATEGORIES[catIdx].color }}>
              {nameIndex === 0 && (
                <td rowSpan={NAMES.length} style={{backgroundColor: 'white', color: 'black', minWidth: 120}}>
                  {categoryFixed[catIdx] ? (
                    <>
                      {cat}
                      <button style={{marginLeft: 6, fontSize: '0.9em'}} onClick={() => handleEdit(catIdx)} disabled={!categoryFixed[catIdx] || !editable}>수정</button>
                    </>
                  ) : (
                    <>
                      <input 
                        type="text" 
                        value={categoryInputs[catIdx]} 
                        onChange={e => handleInputChange(catIdx, e.target.value)}
                        style={{width: 90}}
                        disabled={categoryFixed[catIdx] || !editable}
                      />
                      <button style={{marginLeft: 6, fontSize: '0.9em'}} onClick={() => handleSave(catIdx)} disabled={!editable}>저장</button>
                    </>
                  )}
                </td>
              )}
              <td style={{color: 'black'}}>{name}</td>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const editableCell = editable && isCellEditable(day, catIdx);
                return (
                  <td 
                    key={day} 
                    onClick={() => handleCellClick(cat, name, day, catIdx)}
                    style={{
                      cursor: editableCell ? 'pointer' : 'not-allowed', 
                      color: 'black',
                      backgroundColor: !editableCell ? '#f3f3f3' : undefined
                    }}
                  >
                    {records[`${cat}-${name}-${day}`]}
                  </td>
                );
              })}
              <td style={{fontWeight: 'bold', color: 'black'}}>{countO(cat, name)}</td>
              <td style={{fontWeight: 'bold', color: 'black'}}>{getThreeMonthAverage(DEFAULT_CATEGORIES[catIdx].name, name)}</td>
            </tr>
          ))
        ))}
      </tbody>
    </table>
  );
};

export default RecordTable; 