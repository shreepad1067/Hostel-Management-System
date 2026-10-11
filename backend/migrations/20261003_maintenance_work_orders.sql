CREATE TABLE IF NOT EXISTS maintenance_work_orders (
    id INT NOT NULL
        AUTO_INCREMENT,

    student_id INT NULL,

    room_id INT NULL,

    created_by_user_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,

    description VARCHAR(1500) NOT NULL,

    category VARCHAR(50) NOT NULL,

    priority VARCHAR(20)
        NOT NULL
        DEFAULT 'Medium',

    status VARCHAR(30)
        NOT NULL
        DEFAULT 'Open',

    assigned_to VARCHAR(150) NULL,

    assigned_contact VARCHAR(50) NULL,

    scheduled_date DATE NULL,

    resolution VARCHAR(1500) NULL,

    completed_at DATETIME NULL,

    created_at DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    PRIMARY KEY (id),


    INDEX idx_maintenance_student (
        student_id
    ),

    INDEX idx_maintenance_room (
        room_id
    ),

    INDEX idx_maintenance_priority (
        priority
    ),

    INDEX idx_maintenance_status (
        status
    ),


    CONSTRAINT fk_maintenance_student
        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE SET NULL,


    CONSTRAINT fk_maintenance_room
        FOREIGN KEY (
            room_id
        )
        REFERENCES rooms(id)
        ON DELETE SET NULL,


    CONSTRAINT fk_maintenance_created_by
        FOREIGN KEY (
            created_by_user_id
        )
        REFERENCES users(id)
        ON DELETE RESTRICT
);