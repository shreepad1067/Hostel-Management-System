from datetime import (
    date,
    datetime,
)

import unicodedata


# ======================================================
# SIMPLE PDF GENERATOR
#
# Uses only Python standard library.
# No reportlab / third-party PDF package required.
# ======================================================


def safe_text(
    value,
) -> str:

    if value is None:
        return "-"

    text = str(
        value
    )

    text = (
        unicodedata
        .normalize(
            "NFKD",
            text,
        )
        .encode(
            "ascii",
            "ignore",
        )
        .decode(
            "ascii",
        )
    )

    return (
        text
        or "-"
    )


def pdf_escape(
    value,
) -> str:

    text = safe_text(
        value
    )

    return (
        text
        .replace(
            "\\",
            "\\\\",
        )
        .replace(
            "(",
            "\\(",
        )
        .replace(
            ")",
            "\\)",
        )
    )


def format_date(
    value,
) -> str:

    if value is None:
        return "-"

    if isinstance(
        value,
        datetime,
    ):
        return value.strftime(
            "%d %b %Y, %I:%M %p"
        )

    if isinstance(
        value,
        date,
    ):
        return value.strftime(
            "%d %b %Y"
        )

    return safe_text(
        value
    )


def money(
    value,
) -> str:

    try:
        amount = float(
            value
        )

        return (
            f"INR {amount:,.2f}"
        )

    except (
        TypeError,
        ValueError,
    ):
        return "INR 0.00"


def wrap_text(
    value,
    max_chars=68,
):

    text = safe_text(
        value
    )

    words = text.split()

    if not words:
        return ["-"]

    lines = []

    current = ""

    for word in words:

        candidate = (
            word
            if not current
            else (
                current
                + " "
                + word
            )
        )

        if (
            len(candidate)
            <= max_chars
        ):
            current = (
                candidate
            )

        else:

            if current:
                lines.append(
                    current
                )

            current = word

    if current:
        lines.append(
            current
        )

    return lines


def generate_fee_receipt_pdf(
    *,
    hostel,
    student,
    fee,
    transaction,
) -> bytes:

    commands = []


    def text(
        x,
        y,
        value,
        size=10,
        bold=False,
    ):
        font = (
            "F2"
            if bold
            else "F1"
        )

        commands.append(
            "BT "
            f"/{font} {size} Tf "
            f"1 0 0 1 {x} {y} Tm "
            f"({pdf_escape(value)}) "
            "Tj ET"
        )


    def line(
        x1,
        y1,
        x2,
        y2,
        width=1,
    ):
        commands.append(
            f"{width} w "
            f"{x1} {y1} m "
            f"{x2} {y2} l S"
        )


    def rectangle(
        x,
        y,
        width,
        height,
        gray=0.96,
    ):
        commands.append(
            "q "
            f"{gray} g "
            f"{x} {y} "
            f"{width} {height} "
            "re f Q"
        )


    hostel_name = (
        getattr(
            hostel,
            "hostel_name",
            None,
        )
        or
        "HostelHub Residence"
    )

    hostel_address = (
        getattr(
            hostel,
            "address",
            None,
        )
        or
        ""
    )

    hostel_phone = (
        getattr(
            hostel,
            "phone",
            None,
        )
        or
        ""
    )

    hostel_email = (
        getattr(
            hostel,
            "email",
            None,
        )
        or
        ""
    )


    # ==================================================
    # HEADER
    # ==================================================

    text(
        48,
        790,
        hostel_name,
        size=20,
        bold=True,
    )

    text(
        48,
        770,
        "Hostel Management System",
        size=9,
    )


    contact_parts = [
        item
        for item in [
            hostel_address,
            hostel_phone,
            hostel_email,
        ]
        if item
    ]

    if contact_parts:
        text(
            48,
            754,
            " | ".join(
                contact_parts
            ),
            size=8,
        )


    text(
        410,
        790,
        "PAYMENT RECEIPT",
        size=13,
        bold=True,
    )


    line(
        48,
        738,
        547,
        738,
        width=1.2,
    )


    # ==================================================
    # RECEIPT INFORMATION
    # ==================================================

    rectangle(
        48,
        650,
        499,
        72,
    )


    text(
        62,
        700,
        "Receipt Number",
        size=8,
    )

    text(
        62,
        683,
        transaction.receipt_number,
        size=11,
        bold=True,
    )


    text(
        300,
        700,
        "Payment Date",
        size=8,
    )

    text(
        300,
        683,
        format_date(
            transaction.completed_at
        ),
        size=10,
        bold=True,
    )


    text(
        62,
        662,
        (
            "Transaction Reference: "
            + safe_text(
                transaction
                .payment_reference
            )
        ),
        size=8,
    )


    text(
        300,
        662,
        (
            "Payment Method: "
            + safe_text(
                transaction
                .payment_method
            )
        ),
        size=8,
    )


    # ==================================================
    # STUDENT DETAILS
    # ==================================================

    text(
        48,
        620,
        "STUDENT DETAILS",
        size=11,
        bold=True,
    )

    line(
        48,
        612,
        547,
        612,
    )


    text(
        58,
        588,
        "Student Name",
        size=8,
    )

    text(
        170,
        588,
        student.name,
        size=10,
        bold=True,
    )


    text(
        58,
        566,
        "Student ID",
        size=8,
    )

    text(
        170,
        566,
        (
            student.student_code
            or
            f"Student #{student.id}"
        ),
        size=10,
    )


    text(
        58,
        544,
        "Course",
        size=8,
    )

    text(
        170,
        544,
        (
            student.course
            or "-"
        ),
        size=10,
    )


    text(
        330,
        588,
        "Room",
        size=8,
    )

    text(
        405,
        588,
        (
            student.room_number
            or "-"
        ),
        size=10,
        bold=True,
    )


    text(
        330,
        566,
        "Year",
        size=8,
    )

    text(
        405,
        566,
        (
            student.year
            if student.year
            else "-"
        ),
        size=10,
    )


    text(
        330,
        544,
        "Semester",
        size=8,
    )

    text(
        405,
        544,
        (
            student.semester
            if getattr(
                student,
                "semester",
                None,
            )
            else "-"
        ),
        size=10,
    )


    # ==================================================
    # PAYMENT DETAILS
    # ==================================================

    text(
        48,
        500,
        "PAYMENT DETAILS",
        size=11,
        bold=True,
    )

    line(
        48,
        492,
        547,
        492,
    )


    text(
        58,
        468,
        "Fee Description",
        size=8,
    )


    description_lines = (
        wrap_text(
            fee.description
            or
            f"Hostel Fee #{fee.id}",
            58,
        )
    )


    y = 468

    for index, description in enumerate(
        description_lines[:3]
    ):

        text(
            170,
            y - (
                index * 15
            ),
            description,
            size=9,
            bold=(
                index == 0
            ),
        )


    text(
        58,
        414,
        "Fee ID",
        size=8,
    )

    text(
        170,
        414,
        f"#{fee.id}",
        size=9,
    )


    text(
        330,
        468,
        "Due Date",
        size=8,
    )

    text(
        405,
        468,
        format_date(
            fee.due_date
        ),
        size=9,
    )


    text(
        330,
        444,
        "Payment Status",
        size=8,
    )

    text(
        405,
        444,
        transaction.status,
        size=9,
        bold=True,
    )


    text(
        330,
        420,
        "Transaction ID",
        size=8,
    )

    text(
        405,
        420,
        f"#{transaction.id}",
        size=9,
    )


    # ==================================================
    # AMOUNT
    # ==================================================

    rectangle(
        48,
        325,
        499,
        64,
        gray=0.93,
    )


    text(
        64,
        364,
        "AMOUNT PAID",
        size=9,
        bold=True,
    )


    text(
        360,
        354,
        money(
            transaction.amount
        ),
        size=18,
        bold=True,
    )


    # ==================================================
    # CONFIRMATION
    # ==================================================

    text(
        48,
        287,
        "Payment Confirmation",
        size=10,
        bold=True,
    )


    text(
        48,
        268,
        (
            "This receipt confirms that "
            "the payment shown above was "
            "successfully recorded by HostelHub."
        ),
        size=8,
    )


    text(
        48,
        247,
        (
            "Receipt Number: "
            + safe_text(
                transaction
                .receipt_number
            )
        ),
        size=8,
    )


    text(
        48,
        226,
        (
            "Reference: "
            + safe_text(
                transaction
                .payment_reference
            )
        ),
        size=8,
    )


    # ==================================================
    # FOOTER
    # ==================================================

    line(
        48,
        110,
        547,
        110,
    )


    text(
        48,
        91,
        (
            "This is a computer-generated "
            "receipt and does not require "
            "a physical signature."
        ),
        size=8,
    )


    text(
        48,
        74,
        "Generated by HostelHub",
        size=8,
        bold=True,
    )


    # ==================================================
    # BUILD PDF
    # ==================================================

    content = (
        "\n".join(
            commands
        )
        .encode(
            "latin-1",
            errors="replace",
        )
    )


    objects = []


    objects.append(
        b"<< /Type /Catalog "
        b"/Pages 2 0 R >>"
    )


    objects.append(
        b"<< /Type /Pages "
        b"/Kids [3 0 R] "
        b"/Count 1 >>"
    )


    objects.append(
        (
            b"<< /Type /Page "
            b"/Parent 2 0 R "
            b"/MediaBox [0 0 595 842] "
            b"/Resources << "
            b"/Font << "
            b"/F1 4 0 R "
            b"/F2 5 0 R "
            b">> >> "
            b"/Contents 6 0 R "
            b">>"
        )
    )


    objects.append(
        b"<< /Type /Font "
        b"/Subtype /Type1 "
        b"/BaseFont /Helvetica >>"
    )


    objects.append(
        b"<< /Type /Font "
        b"/Subtype /Type1 "
        b"/BaseFont /Helvetica-Bold >>"
    )


    objects.append(
        (
            b"<< /Length "
            + str(
                len(content)
            ).encode()
            + b" >>\nstream\n"
            + content
            + b"\nendstream"
        )
    )


    pdf = bytearray()

    pdf.extend(
        b"%PDF-1.4\n"
    )


    offsets = [
        0
    ]


    for index, obj in enumerate(
        objects,
        start=1,
    ):

        offsets.append(
            len(pdf)
        )

        pdf.extend(
            f"{index} 0 obj\n"
            .encode()
        )

        pdf.extend(
            obj
        )

        pdf.extend(
            b"\nendobj\n"
        )


    xref_offset = (
        len(pdf)
    )


    pdf.extend(
        (
            "xref\n"
            f"0 {len(objects) + 1}\n"
        ).encode()
    )


    pdf.extend(
        b"0000000000 65535 f \n"
    )


    for offset in offsets[
        1:
    ]:

        pdf.extend(
            (
                f"{offset:010d} "
                "00000 n \n"
            ).encode()
        )


    pdf.extend(
        (
            "trailer\n"
            "<< "
            f"/Size {len(objects) + 1} "
            "/Root 1 0 R "
            ">>\n"
            "startxref\n"
            f"{xref_offset}\n"
            "%%EOF"
        ).encode()
    )


    return bytes(
        pdf
    )