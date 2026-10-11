CREATE TABLE IF NOT EXISTS audit_logs (
    id INT NOT NULL AUTO_INCREMENT,

    actor_user_id INT NULL,

    actor_name VARCHAR(150) NULL,

    actor_role VARCHAR(50) NULL,

    action VARCHAR(60) NOT NULL,

    module VARCHAR(80) NOT NULL,

    entity_type VARCHAR(80) NULL,

    entity_id INT NULL,

    description VARCHAR(500) NOT NULL,

    request_method VARCHAR(10) NOT NULL,

    request_path VARCHAR(500) NOT NULL,

    response_status INT NOT NULL,

    outcome VARCHAR(20) NOT NULL,

    details TEXT NULL,

    created_at DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    PRIMARY KEY (id),


    INDEX idx_audit_actor_user (
        actor_user_id
    ),

    INDEX idx_audit_actor_role (
        actor_role
    ),

    INDEX idx_audit_action (
        action
    ),

    INDEX idx_audit_module (
        module
    ),

    INDEX idx_audit_entity_id (
        entity_id
    ),

    INDEX idx_audit_outcome (
        outcome
    ),

    INDEX idx_audit_created_at (
        created_at
    ),


    CONSTRAINT fk_audit_actor_user
        FOREIGN KEY (
            actor_user_id
        )
        REFERENCES users(id)
        ON DELETE SET NULL
);