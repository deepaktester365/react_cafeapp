import { useState, useEffect } from 'react';
import { Form, Container, Row, Col } from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import Body from "../components/Body";
import PageHeader from "../components/common/PageHeader";
import TaskCalendar from "../components/tasks/history/TaskCalendar";
import EmptyState from "../components/common/EmptyState";

export default function TaskStatsPage() {
  const api = useApi();
  const [habits, setHabits] = useState([]);
  const [selectedHabitId, setSelectedHabitId] = useState('');

  // Find the selected object to get its target count
  const currentHabit = habits.find(h => String(h.id) === String(selectedHabitId));
  // If target is 0 (Misc), default to 1 for division safety
  const target = currentHabit ? (currentHabit.repeats || 1) : 1;

  useEffect(() => {
    (async () => {
      const response = await api.get('/habits?per_page=100');
      if (response.ok) {
        setHabits(response.body.items);
        if (response.body.items.length > 0) {
            setSelectedHabitId(response.body.items[0].id);
        }
      }
    })();
  }, [api]);

  return (
    <Body sidebar>
      <PageHeader title="Task Analytics" icon="bi-graph-up" />

      <Container>
        {habits.length === 0 ? (
             <EmptyState title="No Tasks" message="Create tasks in your dashboard to see analytics here." icon="bi-clipboard-data" />
        ) : (
            <>
                <div className="mb-4">
                    <Row className="justify-content-center">
                        <Col md={6}>
                            <Form.Label className="text-header-caps text-body-75 mb-2 text-center w-100">Select Task</Form.Label>
                            <Form.Select
                                size="lg"
                                className="shadow-sm border bg-surface text-primary fw-bold text-center rounded-pill"
                                value={selectedHabitId}
                                onChange={(e) => setSelectedHabitId(e.target.value)}
                            >
                                {habits.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </div>

                <Row className="justify-content-center">
                    <Col lg={8} md={10}>
                        {selectedHabitId && (
                            <TaskCalendar
                                taskId={selectedHabitId}
                                target={target === 0 ? 5 : target} // Handle 'Misc' tasks with dynamic scaling if needed
                            />
                        )}
                    </Col>
                </Row>
            </>
        )}
      </Container>
    </Body>
  );
}
