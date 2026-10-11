CREATE TABLE IF NOT EXISTS room_transfer_requests (
    id INT NOT NULL AUTO_INCREMENT,

    student_id INT NOT NULL,

    current_room_id INT NOT NULL,

    preferred_sharing INT NOT NULL,

    reason VARCHAR(1000) NOT NULL,

    status VARCHAR(20)
        NOT NULL
        DEFAULT 'Pending',

    requested_at DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    reviewed_at DATETIME NULL,

    reviewed_by_user_id INT NULL,

    new_room_id INT NULL,

    admin_note VARCHAR(1000) NULL,

    PRIMARY KEY (id),

    INDEX idx_room_transfer_student (
        student_id
    ),

    INDEX idx_room_transfer_status (
        status
    ),

    INDEX idx_room_transfer_current_room (
        current_room_id
    ),

    INDEX idx_room_transfer_new_room (
        new_room_id
    ),

    CONSTRAINT fk_room_transfer_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_room_transfer_current_room
        FOREIGN KEY (current_room_id)
        REFERENCES rooms(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_room_transfer_new_room
        FOREIGN KEY (new_room_id)
        REFERENCES rooms(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_room_transfer_reviewer
        FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);