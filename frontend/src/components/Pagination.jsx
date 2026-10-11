import "./Pagination.css";


function buildPages(
  currentPage,
  totalPages
) {
  if (
    totalPages <= 7
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (
        _,
        index
      ) =>
        index + 1
    );
  }


  const pages = [
    1,
  ];


  let start =
    Math.max(
      2,
      currentPage - 1
    );


  let end =
    Math.min(
      totalPages - 1,
      currentPage + 1
    );


  if (
    currentPage <= 3
  ) {
    start = 2;
    end = 4;
  }


  if (
    currentPage >=
    totalPages - 2
  ) {
    start =
      totalPages - 3;

    end =
      totalPages - 1;
  }


  if (
    start > 2
  ) {
    pages.push(
      "left-ellipsis"
    );
  }


  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    pages.push(
      page
    );
  }


  if (
    end <
    totalPages - 1
  ) {
    pages.push(
      "right-ellipsis"
    );
  }


  pages.push(
    totalPages
  );


  return pages;
}


function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [
    10,
    25,
    50,
  ],
}) {
  if (
    totalItems === 0
  ) {
    return null;
  }


  const safeTotalPages =
    Math.max(
      1,
      totalPages
    );


  const start =
    (
      currentPage - 1
    ) *
      pageSize +
    1;


  const end =
    Math.min(
      currentPage *
        pageSize,
      totalItems
    );


  const pages =
    buildPages(
      currentPage,
      safeTotalPages
    );


  return (
    <div className="pagination">

      <div className="pagination-summary">

        <span>
          Showing
        </span>

        <strong>
          {start}–{end}
        </strong>

        <span>
          of
        </span>

        <strong>
          {totalItems}
        </strong>

        <span>
          records
        </span>

      </div>


      <div className="pagination-center">

        <button
          type="button"
          className="pagination-nav"
          disabled={
            currentPage <= 1
          }
          onClick={() =>
            onPageChange(
              1
            )
          }
          title="First page"
        >
          «
        </button>


        <button
          type="button"
          className="pagination-nav"
          disabled={
            currentPage <= 1
          }
          onClick={() =>
            onPageChange(
              currentPage - 1
            )
          }
        >
          ‹
        </button>


        {pages.map(
          (
            page
          ) => {

            if (
              typeof page !==
              "number"
            ) {
              return (
                <span
                  key={
                    page
                  }
                  className="pagination-ellipsis"
                >
                  …
                </span>
              );
            }


            return (
              <button
                type="button"
                key={
                  page
                }
                className={
                  `pagination-page ${
                    currentPage ===
                    page
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  onPageChange(
                    page
                  )
                }
              >
                {page}
              </button>
            );
          }
        )}


        <button
          type="button"
          className="pagination-nav"
          disabled={
            currentPage >=
            safeTotalPages
          }
          onClick={() =>
            onPageChange(
              currentPage + 1
            )
          }
        >
          ›
        </button>


        <button
          type="button"
          className="pagination-nav"
          disabled={
            currentPage >=
            safeTotalPages
          }
          onClick={() =>
            onPageChange(
              safeTotalPages
            )
          }
          title="Last page"
        >
          »
        </button>

      </div>


      <label className="pagination-size">

        <span>
          Rows
        </span>

        <select
          value={
            pageSize
          }
          onChange={
            (
              event
            ) =>
              onPageSizeChange(
                Number(
                  event
                    .target
                    .value
                )
              )
          }
        >

          {pageSizeOptions.map(
            (
              size
            ) => (

            <option
              key={
                size
              }
              value={
                size
              }
            >
              {size}
            </option>

            )
          )}

        </select>

      </label>

    </div>
  );
}


export default Pagination;