import { useState } from 'react';
import { Tabs, Tab, Container } from 'react-bootstrap';
import Body from "../components/Body";
import PageHeader from "../components/common/PageHeader";

// Containers
import TaskContainer from "../components/tasks/active/TaskContainer";
// Assuming you will create this next
import LogContainer from "../components/tasks/logs/LogContainer";

export default function () {
  const [key, setKey] = useState('active');

  return (
    <Body sidebar>
      <PageHeader title="My Dashboard" icon="bi-kanban" />

      <Container fluid className="px-0">
        <Tabs
            id="task-dashboard-tabs"
            activeKey={key}
            onSelect={(k) => setKey(k)}
            className="mb-4 custom-tabs border-bottom px-3"
            variant="underline" // Cleaner look than 'tabs'
        >
            <Tab eventKey="active" title="Active Tasks">
                <div className="pt-2">
                    <TaskContainer />
                </div>
            </Tab>

            <Tab eventKey="logs" title="Life Logs">
                <div className="pt-2">
                    {/* Placeholder until we refactor Logs next */}
                    <LogContainer />
                </div>
            </Tab>
        </Tabs>
      </Container>
    </Body>
  );
}
