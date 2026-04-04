import { useState } from 'react';
import { Card } from 'react-bootstrap'; // Added Card import
import usePaginatedApi from '../../../hooks/usePaginatedApi';
import HistoryRow from './HistoryRow';
import LoadingState from '../../common/LoadingState';
import EmptyState from '../../common/EmptyState';
import LoadMore from '../../common/LoadMore';
import EditHistoryModal from '../modals/EditHistoryModal';

export default function TaskHistoryContainer() {
  const { items: logs, setItems, pagination, loadNextPage, updateItem, removeItem } = usePaginatedApi('/habits/logs');
  const [selectedLog, setSelectedLog] = useState(null);

  const handleUpdate = (updatedLog) => {
    updateItem(updatedLog);
  };

  // Helper to format "2026-01-04" -> "Sun, Jan 4"
  const formatDateHeader = (dateStr) => {
    if (!dateStr) return '';
    // Append T00:00:00 to ensure local time parsing isn't messed up by timezones
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container-fluid px-3 pb-5">
      {logs === undefined ? (
        <LoadingState message="Loading history..." />
      ) : logs === null ? (
        <EmptyState title="Error" message="Could not load history." icon="bi-exclamation-triangle" />
      ) : (
        <>
          {logs.length === 0 ? (
            <EmptyState title="No History" message="Complete tasks to see them here." icon="bi-clock-history" />
          ) : (
            // FIX: Wrapped list in a single Card with bg-surface
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden bg-surface">
                <div className="position-relative">
                    {logs.map((log, index) => {
                        const currentDate = log.date_str;
                        const prevDate = logs[index - 1]?.date_str;
                        const showHeader = index === 0 || currentDate !== prevDate;

                        return (
                            <div key={log.id}>
                                {showHeader && (
                                    // FIX: Unified Header Design (Grey background, crisp border)
                                    <div className="bg-body-tertiary px-3 py-2 bg-surface border-bottom border-top d-flex align-items-center">
                                        <i className="bi bi-calendar-check me-2 text-body small"></i>
                                        <span className="fw-bold text-body bg-surface small text-uppercase" style={{letterSpacing:'0.5px'}}>
                                            {formatDateHeader(currentDate)}
                                        </span>
                                    </div>
                                )}
                                <HistoryRow
                                    entry={log}
                                    variant="task"
                                    onClick={() => setSelectedLog(log)}
                                    onDelete={removeItem}
                                />
                            </div>
                        );
                    })}
                </div>
            </Card>
          )}
          <div className="mt-4">
             <LoadMore pagination={pagination} loadNextPage={loadNextPage} />
          </div>
        </>
      )}

      <EditHistoryModal
        show={!!selectedLog}
        log={selectedLog}
        handleClose={() => setSelectedLog(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
