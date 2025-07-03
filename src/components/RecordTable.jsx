import React, { useState, useEffect } from 'react';
import './RecordTable.css';
import { supabase } from '../supabaseClient';

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
      return {
        records: {},
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
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 모바일 화면 여부 체크
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('year', year)
        .eq('month', month);
      if (error) {
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }
      const newRecords = {};
      data.forEach(row => {
        const key = `${row.category}-${row.name}-${row.day}`;
        newRecords[key] = row.value;
      });
      setRecords(newRecords);
      setLoading(false);
    };
    fetchRecords();
    // eslint-disable-next-line
  }, [year, month]);

  const saveRecord = async (categoryName, name, day, value) => {
    await supabase.from('records').upsert({
      year,
      month,
      day,
      category: categoryName,
      name,
      value: value || null
    });
  };

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
    const isReadingCategory = categoryIndex === 1;
    if (isReadingCategory) {
      return isToday || isYesterday;
    }
    return isToday;
  };

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
  const handleCategorySave = idx => {
    setCategories(categories.map((v, i) => i === idx ? categoryInputs[idx] : v));
    setCategoryFixed(categoryFixed.map((v, i) => i === idx ? true : v));
    setEditMode(editMode.map((v, i) => i === idx ? false : v));
  };

  // 셀 클릭 핸들러: 로컬 상태만 변경
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

  // 저장 버튼 핸들러: Supabase에 현재 상태를 통째로 저장
  const handleSave = async () => {
    if (!editable) return;
    setIsSaving(true);

    const upsertRows = [];
    const deleteRows = [];

    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      for (let nameIdx = 0; nameIdx < NAMES.length; nameIdx++) {
        for (let day = 1; day <= daysInMonth; day++) {
          const key = `${categories[catIdx]}-${NAMES[nameIdx]}-${day}`;
          const value = records[key];
          const row = {
            year,
            month,
            day,
            category: categories[catIdx],
            name: NAMES[nameIdx],
          };
          if (value === undefined || value === null) {
            deleteRows.push(row);
          } else {
            upsertRows.push({ ...row, value });
          }
        }
      }
    }

    // 1. value가 null/undefined인 row는 한 번에 delete
    if (deleteRows.length > 0) {
      const years = deleteRows.map(r => r.year);
      const months = deleteRows.map(r => r.month);
      const days = deleteRows.map(r => r.day);
      const categoriesArr = deleteRows.map(r => r.category);
      const names = deleteRows.map(r => r.name);

      await supabase
        .from('records')
        .delete()
        .in('year', years)
        .in('month', months)
        .in('day', days)
        .in('category', categoriesArr)
        .in('name', names);
    }

    // 2. value가 있는 row만 upsert
    if (upsertRows.length > 0) {
      const { error: upsertError } = await supabase
        .from('records')
        .upsert(upsertRows, { onConflict: ['year', 'month', 'day', 'category', 'name'] });

      if (upsertError) {
        alert(`데이터 저장 중 오류가 발생했습니다: ${upsertError.message}`);
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    alert('데이터가 성공적으로 저장되었습니다.');
  };

  // 최근 7일 계산
  const getRecent7Days = () => {
    const today = new Date();
    const lastDay = Math.min(daysInMonth, today.getDate());
    const firstDay = Math.max(1, lastDay - 6);
    return Array.from({ length: lastDay - firstDay + 1 }, (_, i) => firstDay + i);
  };
  const daysToShow = isMobile ? getRecent7Days() : Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 각 멤버별 총점 계산
  const getMemberTotalScore = name => {
    let total = 0;
    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      for (let day = 1; day <= daysInMonth; day++) {
        if (records[`${categories[catIdx]}-${name}-${day}`] === 'O') total++;
      }
    }
    return total;
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={handleSave} disabled={loading || isSaving || !editable} className="save-button">
          {isSaving ? '저장 중...' : '변경사항 저장'}
        </button>
        {loading && <div style={{color:'gray'}}>데이터 불러오는 중...</div>}
      </div>
      <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '1.1em', color: '#fff', textAlign: 'center', width: '100%' }}>
        {NAMES.map((name, idx) => (
          <span key={name} style={{ marginRight: 18 }}>
            {name}: {getMemberTotalScore(name)}
          </span>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>종목</th>
            <th>이름</th>
            {daysToShow.map(day => (
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
                        <button style={{marginLeft: 6, fontSize: '0.9em'}} onClick={() => handleCategorySave(catIdx)} disabled={!editable}>저장</button>
                      </>
                    )}
                  </td>
                )}
                <td style={{color: 'black'}}>{name}</td>
                {daysToShow.map(day => {
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
    </div>
  );
};

export default RecordTable; 