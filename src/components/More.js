import Button from "react-bootstrap/Button";

export default function More({ pagination, loadNextPage }) {
  let thereAreMore = false;
  if (pagination) {
    const { page, per_page, total_pages } = pagination;
    thereAreMore = page < total_pages;
  }

  return (
    <div className="More">
      {thereAreMore &&
        <Button variant="outline-primary" onClick={loadNextPage}>
          More &raquo;
        </Button>
      }
    </div>
  );
}

