import { useState } from 'react';
import { Card } from 'react-bootstrap';
import usePaginatedApi from '../../../hooks/usePaginatedApi';
import HistoryRow from './HistoryRow';
import LoadingState from '../../common/LoadingState';
import EmptyState from '../../common/EmptyState';
import LoadMore from '../../common/LoadMore';
import EditHistoryModal from '../modals/EditHistoryModal';

export default function LogHistoryContainer() {
  const { items: logs, pagination, loadNextPage, updateItem, removeItem } = usePaginatedApi('/lifelogs/logs');
  const [selectedLog, setSelectedLog] = useState(null);

  const handleUpdate = (updatedLog) => {
    updateItem(updatedLog);
  };

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container-fluid px-3 pb-5">
      {logs === undefined ? (
        <LoadingState message="Loading logs..." />
      ) : logs === null ? (
        <EmptyState title="Error" message="Could not load logs." icon="bi-exclamation-triangle" />
      ) : (
        <>
          {logs.length === 0 ? (
            <EmptyState title="No Logs" message="Track your daily metrics to see history." icon="bi-journal-medical" />
          ) : (
            <div>
              {/* FIX: Removed the duplicate logs.map() loop that was here */}

              {/* Unified Card View */}
              <Card className="shadow-sm border-0 rounded-4 overflow-hidden bg-surface">
                  <div className="position-relative">
                      {logs.map((log, index) => {
                          const currentDate = log.date_str;
                          const prevDate = logs[index - 1]?.date_str;
                          const showHeader = index === 0 || currentDate !== prevDate;

                          return (
                              <div key={log.id}>
                                  {showHeader && (
                                      <div className="bg-body-tertiary px-3 py-2 border-bottom bg-surface border-top d-flex align-items-center">
                                          <i className="bi bi-calendar-event me-2 text-body small"></i>
                                          <span className="fw-bold text-body bg-surface small text-uppercase" style={{letterSpacing:'0.5px'}}>
                                              {formatDateHeader(currentDate)}
                                          </span>
                                      </div>
                                  )}
                                  <HistoryRow
                                      entry={log}
                                      variant="log"
                                      onClick={() => setSelectedLog(log)}
                                      onDelete={removeItem}
                                  />
                              </div>
                          );
                      })}
                  </div>
              </Card>
            </div>
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
