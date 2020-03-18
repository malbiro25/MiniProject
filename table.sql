#
CREATE TABLE IF NOT EXISTS users(
	id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(40) NOT NULL COMMENT 'SHA1(password + salt) in HEX',
    nickname VARCHAR(50) NOT NULL COMMENT 'Used only for visual representation, not for login',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX e (email),
    INDEX p (password)
);

#
CREATE TABLE IF NOT EXISTS messages(
	id INT AUTO_INCREMENT PRIMARY KEY,
    txt TEXT NOT NULL COMMENT 'Message body',
    receiver_id INT NOT NULL,
	sender_id INT NOT NULL,
	status ENUM('SENT', 'ARRIVED', 'SEEN') NOT NULL COMMENT 'Used for status arrows like WhatsApp',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX s (status),
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);