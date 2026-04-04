import { useState } from 'react';
import { Card } from 'react-bootstrap'; // Import Card
import { useApi } from '../../../contexts/ApiProvider';
import usePaginatedApi from '../../../hooks/usePaginatedApi';

// Components
import LogRow from './LogRow';
import LogAddForm from './LogAddForm';
import LoadingState from '../../common/LoadingState';
import EmptyState from '../../common/EmptyState';
import LoadMore from '../../common/LoadMore';

// Modals
import EditLifeLogModal from '../modals/EditLifeLogModal';
import LogLifelogModal from '../modals/LogLifelogModal';

export default function LogContainer() {
  const api = useApi();
  const { items: logs, setItems, pagination, loadNextPage, addItem, updateItem, removeItem } = usePaginatedApi('/lifelogs');

  // Modal State
  const [selectedItemId, setSelectedItemId] = useState(null); // For Edit
  const [activeLogItem, setActiveLogItem] = useState(null);   // For Tracking (Plus button)

  // Handlers
  const handleTrackClick = (item) => {
    const hasConfig = item.schema_config && Object.keys(item.schema_config).length > 0;
    if (hasConfig) {
      setActiveLogItem(item);
    } else {
      // Simple increment if no config
      api.put(`/lifelogs/adjust/${item.id}`, { change_type: 'increment' })
          .then(res => { if(res.ok) updateItem(res.body); });
    }
  };

  return (
    <div className="container-fluid px-3 pb-5">

        {/* ADD FORM */}
        <LogAddForm onAdd={addItem} />

        {/* LIST */}
        {logs === undefined ? (
            <LoadingState message="Loading logs..." />
        ) : logs === null ? (
            <EmptyState title="Error" message="Could not load logs." icon="bi-exclamation-triangle" />
        ) : (
            <>
                {logs.length === 0 ? (
                    <EmptyState title="No Logs" message="Create a log above to track things like symptoms, caffeine, or mood." icon="bi-heart-pulse" />
                ) : (
                    <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-surface">
                        <div className="position-relative">
                            {logs.map((log) => (
                                <LogRow
                                    key={log.id}
                                    log={log}
                                    onClick={() => setSelectedItemId(log.id)}
                                    onTrack={() => handleTrackClick(log)}
                                />
                            ))}
                        </div>
                    </Card>
                )}
                <div className="mt-4">
                    <LoadMore pagination={pagination} loadNextPage={loadNextPage} />
                </div>
            </>
        )}

        {/* MODALS */}
        <EditLifeLogModal
            itemId={selectedItemId}
            show={!!selectedItemId}
            handleClose={() => setSelectedItemId(null)}
            onUpdate={updateItem}
            onDelete={removeItem}
        />

        {/* Optional Logger Modal */}
        {LogLifelogModal && (
             <LogLifelogModal
                show={!!activeLogItem}
                onHide={() => setActiveLogItem(null)}
                task={activeLogItem}
                onSave={(data) => {
                     api.put(`/lifelogs/adjust/${activeLogItem.id}`, {
                         change_type: 'increment',
                         meta_data: data
                     }).then(res => {
                         if(res.ok) updateItem(res.body);
                     });
                }}
             />
        )}
    </div>
  );
}
