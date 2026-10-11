SET @schema_name = DATABASE();


/* =====================================================
   QR CODE
===================================================== */

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'visitors'
      AND column_name = 'qr_code'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE visitors ADD COLUMN qr_code VARCHAR(100) NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


/* =====================================================
   APPROVED AT
===================================================== */

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'visitors'
      AND column_name = 'approved_at'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE visitors ADD COLUMN approved_at DATETIME NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


/* =====================================================
   APPROVED BY
===================================================== */

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'visitors'
      AND column_name = 'approved_by_user_id'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE visitors ADD COLUMN approved_by_user_id INT NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


/* =====================================================
   CREATED AT
===================================================== */

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'visitors'
      AND column_name = 'created_at'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE visitors ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


/* =====================================================
   UNIQUE QR INDEX
===================================================== */

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'visitors'
      AND index_name = 'uq_visitors_qr_code'
);

SET @sql = IF(
    @index_exists = 0,
    'CREATE UNIQUE INDEX uq_visitors_qr_code ON visitors(qr_code)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


/* =====================================================
   STUDENT INDEX
===================================================== */

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'visitors'
      AND index_name = 'idx_visitors_student_id'
);

SET @sql = IF(
    @index_exists = 0,
    'CREATE INDEX idx_visitors_student_id ON visitors(student_id)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


/* =====================================================
   STATUS INDEX
===================================================== */

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'visitors'
      AND index_name = 'idx_visitors_status'
);

SET @sql = IF(
    @index_exists = 0,
    'CREATE INDEX idx_visitors_status ON visitors(status)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


/* =====================================================
   VISIT DATE INDEX
===================================================== */

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'visitors'
      AND index_name = 'idx_visitors_visit_date'
);

SET @sql = IF(
    @index_exists = 0,
    'CREATE INDEX idx_visitors_visit_date ON visitors(visit_date)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


/* =====================================================
   APPROVED-BY FOREIGN KEY
===================================================== */

SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE constraint_schema = @schema_name
      AND table_name = 'visitors'
      AND constraint_name = 'fk_visitors_approved_by'
      AND constraint_type = 'FOREIGN KEY'
);

SET @sql = IF(
    @fk_exists = 0,
    'ALTER TABLE visitors ADD CONSTRAINT fk_visitors_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;