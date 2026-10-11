from starlette.middleware.base import (
    BaseHTTPMiddleware,
)

from database import SessionLocal

from services.audit_service import (
    create_audit_log,
    decode_token_payload,
    extract_bearer_token,
    should_audit_request,
)


class AuditMiddleware(
    BaseHTTPMiddleware
):

    async def dispatch(
        self,
        request,
        call_next,
    ):

        method = (
            request.method
        )

        path = (
            request.url.path
        )


        should_audit = (
            should_audit_request(
                method,
                path,
            )
        )


        payload = {}


        if should_audit:

            token = (
                extract_bearer_token(
                    request.headers.get(
                        "Authorization"
                    )
                )
            )


            if token:
                payload = (
                    decode_token_payload(
                        token
                    )
                )


        try:

            response = await call_next(
                request
            )


            status_code = (
                response.status_code
            )


        except Exception:

            status_code = 500


            if (
                should_audit
                and
                payload
            ):

                self._save_log(
                    payload=
                        payload,

                    method=
                        method,

                    path=
                        path,

                    response_status=
                        status_code,
                )


            raise


        if (
            should_audit
            and
            payload
        ):

            self._save_log(
                payload=
                    payload,

                method=
                    method,

                path=
                    path,

                response_status=
                    status_code,
            )


        return response


    @staticmethod
    def _save_log(
        *,
        payload,
        method,
        path,
        response_status,
    ):

        db = SessionLocal()


        try:

            create_audit_log(
                db=db,

                payload=
                    payload,

                method=
                    method,

                path=
                    path,

                response_status=
                    response_status,
            )


        except Exception as error:

            # Audit logging must never cause
            # the original HostelHub request
            # to fail.
            db.rollback()

            print(
                "Audit log error:",
                error,
            )


        finally:

            db.close()