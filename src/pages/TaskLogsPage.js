import { useState } from 'react';
import { Tabs, Tab, Container } from 'react-bootstrap';
import Body from "../components/Body";
import PageHeader from "../components/common/PageHeader";

// New Containers
import TaskHistoryContainer from "../components/tasks/history/TaskHistoryContainer";
import LogHistoryContainer from "../components/tasks/history/LogHistoryContainer";

export default function TaskLogsPage() {
  const [key, setKey] = useState('tasks');

  return (
    <Body sidebar>
      <PageHeader title="Log History" icon="bi-clock-history" />

      <Container fluid className="px-0">
        <Tabs
            id="logs-tabs"
            activeKey={key}
            onSelect={(k) => setKey(k)}
            className="mb-4 custom-tabs border-bottom text-body-75 bg-surface px-3"
            variant="underline"
        >
            <Tab eventKey="tasks" title="Task History">
                <div className="pt-2">
                    <TaskHistoryContainer />
                </div>
            </Tab>

            <Tab eventKey="logs" title="Life Logs">
                <div className="pt-2">
                    <LogHistoryContainer />
                </div>
            </Tab>
        </Tabs>
      </Container>
    </Body>
  );
}
