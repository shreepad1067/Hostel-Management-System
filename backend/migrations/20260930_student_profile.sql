SET @schema_name = DATABASE();


SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'students'
      AND column_name = 'department'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE students ADD COLUMN department VARCHAR(100) NULL AFTER course',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'students'
      AND column_name = 'semester'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE students ADD COLUMN semester INT NULL AFTER year',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'students'
      AND column_name = 'profile_photo_url'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE students ADD COLUMN profile_photo_url VARCHAR(500) NULL AFTER semester',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
