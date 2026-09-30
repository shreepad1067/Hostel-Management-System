CREATE TABLE IF NOT EXISTS meal_qr_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_type VARCHAR(20) NOT NULL,
    meal_date DATE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_by INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_meal_qr_date (
        meal_date
    ),

    CONSTRAINT fk_meal_qr_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS payment_settings (
    id INT PRIMARY KEY,

    payment_enabled BOOLEAN NOT NULL
        DEFAULT TRUE,

    account_holder_name VARCHAR(150),

    bank_name VARCHAR(150),

    account_last4 VARCHAR(4),

    ifsc_code VARCHAR(30),

    upi_id VARCHAR(100),

    support_email VARCHAR(150),

    failure_message VARCHAR(500),

    updated_by INT,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_settings_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
);


INSERT INTO payment_settings (
    id,
    payment_enabled
)
VALUES (
    1,
    TRUE
)
ON DUPLICATE KEY UPDATE
    id = id;


CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    fee_id INT NOT NULL,

    student_id INT NOT NULL,

    amount DECIMAL(10, 2) NOT NULL,

    status VARCHAR(30) NOT NULL
        DEFAULT 'Initiated',

    payment_method VARCHAR(50) NOT NULL
        DEFAULT 'Online Demo',

    payment_reference VARCHAR(100)
        UNIQUE,

    receipt_number VARCHAR(100)
        UNIQUE,

    failure_reason VARCHAR(500),

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    completed_at DATETIME,

    INDEX idx_payment_fee (
        fee_id
    ),

    INDEX idx_payment_student (
        student_id
    ),

    CONSTRAINT fk_payment_fee
        FOREIGN KEY (fee_id)
        REFERENCES fees(id),

    CONSTRAINT fk_payment_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
);


CREATE TABLE IF NOT EXISTS food_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    meal_date DATE NOT NULL,

    meal_type VARCHAR(20) NOT NULL,

    taste_rating TINYINT NOT NULL,

    quality_rating TINYINT NOT NULL,

    quantity_rating TINYINT NOT NULL,

    hygiene_rating TINYINT NOT NULL,

    comment VARCHAR(1000),

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_student_food_feedback
        UNIQUE (
            student_id,
            meal_date,
            meal_type
        ),

    CONSTRAINT fk_food_feedback_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS website_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    category VARCHAR(30) NOT NULL,

    rating TINYINT NOT NULL,

    message VARCHAR(1500) NOT NULL,

    status VARCHAR(30) NOT NULL
        DEFAULT 'New',

    admin_note VARCHAR(1000),

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_website_feedback_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS hostel_profile (
    id INT PRIMARY KEY,

    hostel_name VARCHAR(200) NOT NULL,

    description TEXT,

    hero_image_url VARCHAR(500),

    address VARCHAR(500),

    phone VARCHAR(30),

    email VARCHAR(150),

    facilities TEXT,

    rules TEXT,

    emergency_contacts TEXT,

    office_hours VARCHAR(250),

    capacity INT,

    blocks INT,

    mess_info TEXT,

    updated_by INT,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_hostel_profile_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
);


INSERT INTO hostel_profile (
    id,
    hostel_name,
    description
)
VALUES (
    1,
    'HostelHub Residence',
    'Welcome to HostelHub.'
)
ON DUPLICATE KEY UPDATE
    id = id;