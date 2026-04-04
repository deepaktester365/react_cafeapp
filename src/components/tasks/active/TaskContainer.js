import { useState, useEffect, useMemo } from 'react';
import { Button, Card } from 'react-bootstrap'; // Added Card import
import { useApi } from '../../../contexts/ApiProvider';

// Components
import TaskRow from './TaskRow';
import TaskAddForm from './TaskAddForm';
import LoadingState from '../../common/LoadingState';
import EmptyState from '../../common/EmptyState';

// Modals
import LogTaskModal from '../modals/LogTaskModal';
import EditTaskModal from '../modals/EditTaskModal';

export default function TaskContainer() {
  const api = useApi();
  const [tasks, setTasks] = useState();
  const [queryDate, setQueryDate] = useState(new Date());

  // Modal State
  const [activeLogTask, setActiveLogTask] = useState(null);
  const [activeEditTask, setActiveEditTask] = useState(null);

  // 1. Fetch Data
  const fetchTasks = async (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const response = await api.get(`/habits?date=${formattedDate}`);
    if (response.ok) {
        setTasks(response.body.items);
    } else {
        setTasks(null);
    }
  };

  useEffect(() => {
    fetchTasks(queryDate);
  }, [api, queryDate]);

  // 2. Logic Handlers
  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleTaskDelete = (deletedId) => {
    setTasks(prev => prev.filter(t => t.id !== deletedId));
  };

  const handleTaskAdd = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleTrackClick = (task) => {
    const hasConfig = task.schema_config && Object.keys(task.schema_config).length > 0;
    if (hasConfig) {
      setActiveLogTask(task);
    } else {
      submitSimpleLog(task);
    }
  };

  const submitSimpleLog = async (task) => {
    const response = await api.put(`/habits/adjust/${task.id}`, {
        change_type: 'increment'
    });
    if (response.ok) handleTaskUpdate(response.body);
  };

  const changeDate = (days) => {
    const newDate = new Date(queryDate);
    newDate.setDate(newDate.getDate() + days);
    setQueryDate(newDate);
    setTasks(undefined); // Trigger loading state
  };

  // 3. Sorting & Grouping
  const FREQUENCY_ORDER = { 'daily': 1, 'weekly': 2, 'monthly': 3, 'yearly': 4, 'misc': 5 };

  const sortedTasks = useMemo(() => {
    if (!tasks) return null;
    return [...tasks].sort((a, b) => {
      const freqA = (a.frequency || 'Misc').toLowerCase();
      const freqB = (b.frequency || 'Misc').toLowerCase();

      // Sort by Frequency Group
      const orderDiff = (FREQUENCY_ORDER[freqA] || 99) - (FREQUENCY_ORDER[freqB] || 99);
      if (orderDiff !== 0) return orderDiff;

      // Sort by Name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [tasks]);

  const getFrequencyHeader = (freq) => {
    const styleMap = {
      'daily': { icon: 'bi-sun-fill', color: 'text-warning', label: 'Daily Tasks' },
      'weekly': { icon: 'bi-calendar-week', color: 'text-primary', label: 'Weekly Goals' },
      'monthly': { icon: 'bi-moon-stars-fill', color: 'text-info', label: 'Monthly Goals' },
      'yearly': { icon: 'bi-calendar-event', color: 'text-success', label: 'Long Term' },
      'misc': { icon: 'bi-collection', color: 'text-secondary', label: 'Misc & Counters' },
    };
    return styleMap[freq?.toLowerCase()] || styleMap['daily'];
  };

  // --- RENDER ---
  return (
    <div className="container-fluid px-3 pb-5">

        {/* DATE NAVIGATOR */}
        <div className="d-flex justify-content-center align-items-center mb-4">
            {/* FIX: Changed bg-white to bg-surface so it adapts to Dark Mode */}
            <div className="bg-surface rounded-pill shadow-sm border px-2 py-1 d-flex align-items-center">
                <Button variant="link" className="text-body" onClick={() => changeDate(-1)}>
                    <i className="bi bi-chevron-left"></i>
                </Button>
                <div className="mx-3 text-center" style={{minWidth: '120px'}}>
                    {/* FIX: Removed text-dark */}
                    <div className="fw-bold">{queryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}</div>
                    {/* Optional: Show "Today" if it matches */}
                    {queryDate.toDateString() === new Date().toDateString() && (
                        <div className="text-primary text-uppercase" style={{fontSize: '0.65rem', letterSpacing: '1px', fontWeight: 'bold'}}>Today</div>
                    )}
                </div>
                <Button variant="link" className="text-body" onClick={() => changeDate(1)}>
                    <i className="bi bi-chevron-right"></i>
                </Button>
            </div>
        </div>

        {/* ADD FORM */}
        <TaskAddForm onAdd={handleTaskAdd} />

        {/* LIST */}
        {tasks === undefined ? (
            <LoadingState message="Loading your schedule..." />
        ) : tasks === null ? (
            <EmptyState title="Error" message="Could not load tasks." icon="bi-exclamation-triangle" />
        ) : sortedTasks.length === 0 ? (
            <EmptyState title="No Tasks Found" message="You have no tasks scheduled for this day." icon="bi-calendar-check" />
        ) : (
            // FIX: Wrapped list in a Card with bg-surface to ensure correct background color
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-surface">
                <div className="position-relative">
                    {sortedTasks.map((task, index) => {
                        // Header Logic
                        const previousTask = sortedTasks[index - 1];
                        const currentFreq = task.frequency || 'Misc';
                        const prevFreq = previousTask ? (previousTask.frequency || 'Misc') : null;
                        const showHeader = index === 0 || currentFreq !== prevFreq;
                        const headerStyle = getFrequencyHeader(currentFreq);

                        return (
                            <div key={task.id}>
                                {showHeader && (
                                    <div className="d-flex align-items-center pb-2 pt-4 px-3 border-top">
                                        <i className={`bi ${headerStyle.icon} ${headerStyle.color} me-2`}></i>
                                        <span className="text-header-caps mb-0 text-body">{headerStyle.label}</span>
                                    </div>
                                )}
                                <TaskRow
                                    task={task}
                                    onTrack={() => handleTrackClick(task)}
                                    onEdit={() => setActiveEditTask(task)}
                                />
                            </div>
                        );
                    })}
                </div>
            </Card>
        )}

        {/* MODALS */}
        <LogTaskModal
            show={!!activeLogTask}
            onHide={() => setActiveLogTask(null)}
            task={activeLogTask}
            onSave={(data) => {
                api.put(`/habits/adjust/${activeLogTask.id}`, {
                    change_type: 'increment',
                    meta_data: data
                }).then(res => {
                    if(res.ok) handleTaskUpdate(res.body);
                });
            }}
        />

        {activeEditTask && (
            <EditTaskModal
                itemId={activeEditTask.id}
                show={!!activeEditTask}
                handleClose={() => setActiveEditTask(null)}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
            />
        )}
    </div>
  );
}
