import Button from "react-bootstrap/Button";

export default function More({ pagination, loadNextPage }) {
  let thereAreMore = false;

  // Safe check to ensure pagination exists before accessing properties
  if (pagination) {
    const { page, total_pages } = pagination;
    thereAreMore = page < total_pages;
  }

  if (!thereAreMore) return null;

  return (
    <div className="LoadMore text-center py-4">
        <Button
            variant="outline-primary"
            onClick={loadNextPage}
            className="rounded-pill px-4 shadow-sm fw-bold"
        >
          Load More <i className="bi bi-chevron-down ms-1"></i>
        </Button>
    </div>
  );
}
