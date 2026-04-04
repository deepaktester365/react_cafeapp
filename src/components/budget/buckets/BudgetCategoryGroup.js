import { useState } from 'react';
import { Card, Table } from 'react-bootstrap';
import BudgetBucketRow from './BudgetBucketRow';
import { formatCurrency } from '../../../utils/currency';
import CreateBucketModal from '../modals/CreateBucketModal';

export default function BudgetCategoryGroup({ category, viewDate, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <Card className="bg-surface shadow-sm border-0 mb-4 rounded-4 overflow-hidden">

      <Card.Header className="bg-body-tertiary py-3 px-4 d-flex bg-surface justify-content-between align-items-center border-bottom">
        <h6 className="mb-0 text-primary fw-bold text-uppercase letter-spacing-1">
          {category.name}
        </h6>
        <div className="text-body small d-flex gap-3">
          <span>Assigned: <span className="fw-bold">{formatCurrency(category.total_assigned)}</span></span>
          <span className="d-none d-sm-inline text-body">|</span>
          <span>Available: <span className="fw-bold text-success">{formatCurrency(category.total_available)}</span></span>
        </div>
      </Card.Header>

      <div className="table-responsive">
        <Table hover className="mb-0 align-middle">
            <thead className="bg-body-tertiary text-body small bg-surface text-uppercase">
                <tr>
                    <th className="ps-4 py-2 border-0 w-40">Bucket</th>
                    <th className="text-end py-2 border-0 w-15 d-none d-md-table-cell">Goal</th>
                    <th className="text-end py-2 border-0 w-15">Assigned</th>
                    <th className="text-end py-2 border-0 w-15">Activity</th>
                    <th className="text-end py-2 pe-4 border-0 w-15">Available</th>
                </tr>
            </thead>
            <tbody>
                {/* FIX: Wrapped the map function in curly braces {} */}
                {category.buckets.map(bucket => (
                    <BudgetBucketRow key={bucket.id} bucket={bucket} viewDate={viewDate} />
                ))}

                {/* Add Bucket Row */}
                <tr>
                    <td colSpan="5" className="p-2">
                        <div
                            onClick={() => setShowAddModal(true)}
                            className="d-flex align-items-center justify-content-center p-2 rounded-3 border border-dashed border-secondary-subtle text-body-50 hover-bg-body-tertiary transition-all"
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="bi bi-plus-lg me-2"></i>
                            <span className="small fw-bold">Add Bucket</span>
                        </div>
                    </td>
                </tr>
            </tbody>
        </Table>
      </div>

      <CreateBucketModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        categoryId={category.id}
        onSuccess={onRefresh}
      />
    </Card>
  );
}
