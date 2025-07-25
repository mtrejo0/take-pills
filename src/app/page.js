"use client"

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Pill, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { commonMedications } from '../data/medications';

const PillTracker = () => {
  const [medications, setMedications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [daysToShow, setDaysToShow] = useState(1); // Start with just today
  const [newMed, setNewMed] = useState({
    name: '',
    description: '',
    scheduleType: 'daily', // 'daily' or 'first-day-different'
    dailyDoses: [{ time: '12:00', pills: 1 }],
    firstDayPills: 2,
    regularDayPills: 1
  });
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredMedications, setFilteredMedications] = useState([]);

  // Load medications from localStorage
  useEffect(() => {
    const savedMeds = localStorage.getItem('pillTrackerMedications');
    if (savedMeds) {
      try {
        setMedications(JSON.parse(savedMeds));
      } catch (error) {
        console.error('Error loading medications from localStorage:', error);
      }
    }
  }, []);

  // Save medications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pillTrackerMedications', JSON.stringify(medications));
  }, [medications]);

  const [medicationHistory, setMedicationHistory] = useState({});

  // Helper function to get current date
  const getCurrentDate = () => {
    const now = new Date();
    // Set to start of day to avoid time issues
    now.setHours(0, 0, 0, 0);
    return now;
  };

  // Load medication history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('pillTrackerHistory');
    if (savedHistory) {
      try {
        setMedicationHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading medication history from localStorage:', error);
      }
    }
  }, []);

  // Save medication history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pillTrackerHistory', JSON.stringify(medicationHistory));
  }, [medicationHistory]);

  // Filter medications for autocomplete
  const filterMedications = (input) => {
    if (!input.trim()) {
      setFilteredMedications([]);
      setShowAutocomplete(false);
      return;
    }
    
    const filtered = commonMedications.filter(med => 
      med.name.toLowerCase().includes(input.toLowerCase()) ||
      med.description.toLowerCase().includes(input.toLowerCase())
    );
    
    setFilteredMedications(filtered.slice(0, 8)); // Limit to 8 results
    setShowAutocomplete(filtered.length > 0);
  };

  const selectMedication = (med) => {
    setNewMed(prev => ({
      ...prev,
      name: med.name,
      description: med.description
    }));
    setShowAutocomplete(false);
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAddForm && !event.target.closest('.autocomplete-container')) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddForm]);

  const addDose = () => {
    setNewMed(prev => ({
      ...prev,
      dailyDoses: [...prev.dailyDoses, { time: '12:00', pills: 1 }]
    }));
  };

  const updateDose = (index, field, value) => {
    setNewMed(prev => ({
      ...prev,
      dailyDoses: prev.dailyDoses.map((dose, i) => 
        i === index ? { ...dose, [field]: value } : dose
      )
    }));
  };

  const removeDose = (index) => {
    setNewMed(prev => ({
      ...prev,
      dailyDoses: prev.dailyDoses.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    const medication = {
      ...newMed,
      id: Date.now(),
      dailyDoses: newMed.dailyDoses.sort((a, b) => a.time.localeCompare(b.time))
    };
    setMedications(prev => [...prev, medication]);
    setNewMed({
      name: '',
      description: '',
      scheduleType: 'daily',
      dailyDoses: [{ time: '12:00', pills: 1 }],
      firstDayPills: 2,
      regularDayPills: 1
    });
    setShowAddForm(false);
  };

  const startEditing = (med) => {
    setEditingMed({
      id: med.id,
      name: med.name,
      description: med.description
    });
  };

  const saveEdit = () => {
    setMedications(prev => prev.map(med => 
      med.id === editingMed.id 
        ? { ...med, name: editingMed.name, description: editingMed.description }
        : med
    ));
    setEditingMed(null);
  };

  const cancelEdit = () => {
    setEditingMed(null);
  };

  const deleteMedication = (medId, medName) => {
    if (window.confirm(`Are you sure you want to delete "${medName}"? This action cannot be undone.`)) {
      setMedications(prev => prev.filter(med => med.id !== medId));
      // Also clean up any history for this medication
      setMedicationHistory(prev => {
        const newHistory = {};
        Object.keys(prev).forEach(key => {
          if (!key.startsWith(`${medId}-`)) {
            newHistory[key] = prev[key];
          }
        });
        return newHistory;
      });
    }
  };

  const toggleMedicationTaken = (medId, doseIndex, date) => {
    // Convert date to string for storage key
    const dateString = date.toISOString().split('T')[0];
    const key = `${medId}-${doseIndex}-${dateString}`;
    setMedicationHistory(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

    const getAllDays = () => {
    const days = [];
    for (let i = -(daysToShow - 1); i <= 0; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0); // Set to start of day
      days.push(date);
    }
    return days;
  };

  const addMoreDays = () => {
    setDaysToShow(prev => Math.min(prev + 1, 30)); // Max 30 days
  };

  const removeDay = () => {
    setDaysToShow(prev => Math.max(prev - 1, 1)); // Min 1 day
  };

  const getMedicationScheduleForDay = (med, date) => {
    const startDate = new Date('2024-01-01'); // You can make this dynamic
    const currentDate = new Date(date);
    const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (med.scheduleType === 'first-day-different') {
      if (daysDiff === 0) {
        return [{ time: med.dailyDoses[0]?.time || '08:00', pills: med.firstDayPills }];
      } else {
        return med.dailyDoses.map(dose => ({ ...dose, pills: med.regularDayPills }));
      }
    }
    
    return med.dailyDoses;
  };

  const formatDate = (date) => {
    const today = getCurrentDate();
    
    // Create yesterday for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.getTime() === today.getTime()) {
      return `Today (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    }
    if (date.getTime() === yesterday.getTime()) {
      return `Yesterday (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };


  const getCompletionStats = (med, date) => {
    const schedule = getMedicationScheduleForDay(med, date);
    const dateString = date.toISOString().split('T')[0];
    const completed = schedule.filter((_, doseIndex) => 
      medicationHistory[`${med.id}-${doseIndex}-${dateString}`]
    ).length;
    return { completed, total: schedule.length };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 text-black">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-2 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Pill className="text-blue-500" />
            Pill Tracker
          </h1>
          
          {/* Buttons Row */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} className="inline mr-1" />
              Add Medication
            </button>
            
            {daysToShow < 30 && (
              <button
                onClick={addMoreDays}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                + Past Day
              </button>
            )}
            
            {daysToShow > 1 && (
              <button
                onClick={removeDay}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                - Past Day
              </button>
            )}
            
            <span className="text-sm text-gray-600 ml-2">
              Showing {daysToShow} day{daysToShow !== 1 ? 's' : ''}
            </span>
            <div className="text-xs text-gray-500 ml-4">
              💡 &ldquo;Today&rdquo; updates automatically each day
            </div>
          </div>
        </div>

        {/* Date Headers - Only show if we have medications */}
        {medications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2 flex-shrink-0">
            <div className="grid gap-2" style={{ gridTemplateColumns: `240px repeat(${getAllDays().length}, minmax(200px, 200px))` }}>
              <div></div> {/* Empty space for medication names column */}
                                                      {getAllDays().map(date => {
                      const today = getCurrentDate();
                      const isToday = date.getTime() === today.getTime();
                      return (
                        <div key={date.getTime()} className="text-center border-l border-gray-200 first:border-l-0 px-2">
                          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                            {formatDate(date)}
                          </div>

                        </div>
                      );
                    })}
            </div>
          </div>
        )}

        {/* Medications List */}
        <div className="flex-1 overflow-y-auto text-black">
          <div className="space-y-2">
            {medications.map(med => {
              const allDays = getAllDays();
              const isEditing = editingMed?.id === med.id;
              
              return (
                <div key={med.id} className="bg-white rounded-lg shadow-sm p-3 relative">
                  <button
                    onClick={() => deleteMedication(med.id, med.name)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Delete medication"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `240px repeat(${allDays.length}, minmax(200px, 200px))` }}>
                    {/* Medication Info */}
                    <div className="pr-4 flex flex-col justify-center">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingMed.name}
                            onChange={(e) => setEditingMed(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-sm"
                            placeholder="Medication name"
                          />
                          <input
                            type="text"
                            value={editingMed.description}
                            onChange={(e) => setEditingMed(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            placeholder="Description (optional)"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={saveEdit}
                              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => startEditing(med)} className="cursor-pointer">
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm">
                            {med.name}
                          </h3>
                          {med.description && (
                            <p className="text-xs text-gray-600 hover:text-blue-500 transition-colors mt-1">
                              {med.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Click to edit</p>
                        </div>
                      )}
                    </div>

                    {/* Progress Grid - aligned with date headers */}
                    {allDays.map(date => {
                      const schedule = getMedicationScheduleForDay(med, date);
                      const today = getCurrentDate();
                      const isToday = date.getTime() === today.getTime();
                      
                      return (
                        <div key={date.getTime()} className={`border-l border-gray-200 first:border-l-0 px-2 ${isToday ? 'bg-blue-50' : ''}`}>
                          <div className="space-y-1">
                            {schedule.map((dose, doseIndex) => {
                              const dateString = date.toISOString().split('T')[0];
                              const isCompleted = medicationHistory[`${med.id}-${doseIndex}-${dateString}`];
                              
                              return (
                                <div 
                                  key={doseIndex} 
                                  className="flex items-center justify-between p-1 bg-white rounded border text-xs min-h-[24px]"
                                >
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <Clock size={10} className="text-gray-400 flex-shrink-0" />
                                    <span className="font-medium truncate">{dose.time}</span>
                                    <span className="text-gray-600 flex-shrink-0">({dose.pills})</span>
                                  </div>
                                  
                                  <button
                                    onClick={() => toggleMedicationTaken(med.id, doseIndex, date)}
                                    className={`transition-colors flex-shrink-0 ml-1 ${
                                      isCompleted 
                                        ? 'text-green-500 hover:text-green-600' 
                                        : 'text-gray-300 hover:text-gray-400'
                                    }`}
                                  >
                                    {isCompleted ? <CheckCircle size={14} /> : <Circle size={14} />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Daily completion summary */}
                          {schedule.length > 0 && (
                            <div className="mt-2 pt-1 border-t">
                              <div className={`text-xs font-medium text-center ${
                                getCompletionStats(med, date).completed === getCompletionStats(med, date).total && getCompletionStats(med, date).total > 0
                                  ? 'text-green-600' 
                                  : getCompletionStats(med, date).completed > 0
                                    ? 'text-yellow-600'
                                    : 'text-gray-400'
                              }`}>
                                {getCompletionStats(med, date).completed}/{getCompletionStats(med, date).total}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Medication Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add Medication</h2>
              
              <div className="space-y-4">
                <div className="relative autocomplete-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    value={newMed.name}
                    onChange={(e) => {
                      setNewMed(prev => ({ ...prev, name: e.target.value }));
                      filterMedications(e.target.value);
                    }}
                    onFocus={() => {
                      if (newMed.name.trim()) {
                        filterMedications(newMed.name);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Vitamin D"
                  />
                  
                  {/* Autocomplete dropdown */}
                  {showAutocomplete && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredMedications.map((med, index) => (
                        <div
                          key={index}
                          onClick={() => selectMedication(med)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm text-gray-900">{med.name}</div>
                          <div className="text-xs text-gray-600">{med.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newMed.description}
                    onChange={(e) => setNewMed(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Daily vitamin supplement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="daily"
                        checked={newMed.scheduleType === 'daily'}
                        onChange={(e) => setNewMed(prev => ({ ...prev, scheduleType: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Same every day</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="first-day-different"
                        checked={newMed.scheduleType === 'first-day-different'}
                        onChange={(e) => setNewMed(prev => ({ ...prev, scheduleType: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Different first day</span>
                    </label>
                  </div>
                </div>

                {newMed.scheduleType === 'first-day-different' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Day Pills
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newMed.firstDayPills}
                        onChange={(e) => setNewMed(prev => ({ ...prev, firstDayPills: parseInt(e.target.value) }))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Regular Day Pills
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newMed.regularDayPills}
                        onChange={(e) => setNewMed(prev => ({ ...prev, regularDayPills: parseInt(e.target.value) }))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Daily Schedule (Time & Pills per Dose)
                    </label>
                    <button
                      type="button"
                      onClick={addDose}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      Add Time
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {newMed.dailyDoses.map((dose, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={dose.time}
                          onChange={(e) => updateDose(index, 'time', e.target.value)}
                          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {newMed.scheduleType === 'daily' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={dose.pills}
                              onChange={(e) => updateDose(index, 'pills', parseInt(e.target.value))}
                              className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="1"
                            />
                            <span className="text-sm text-gray-600 whitespace-nowrap">pills at {dose.time}</span>
                          </div>
                        )}
                        {newMed.dailyDoses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDose(index)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addMedication}
                  disabled={!newMed.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Medication
                </button>
              </div>
            </div>
          </div>
        )}

        {medications.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Pill className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 mb-4">No medications added yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Your First Medication
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PillTracker;