CREATE TABLE IF NOT EXISTS notifications (
    id INT NOT NULL AUTO_INCREMENT,

    user_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,

    message TEXT NOT NULL,

    category VARCHAR(50)
        NOT NULL
        DEFAULT 'General',

    level VARCHAR(20)
        NOT NULL
        DEFAULT 'Info',

    link VARCHAR(255) NULL,

    is_read BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    created_at DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    read_at DATETIME NULL,

    PRIMARY KEY (id),

    INDEX idx_notifications_user (
        user_id
    ),

    INDEX idx_notifications_read (
        is_read
    ),

    INDEX idx_notifications_created (
        created_at
    ),

    CONSTRAINT
        fk_notifications_user

        FOREIGN KEY (user_id)

        REFERENCES users(id)

        ON DELETE CASCADE
);
