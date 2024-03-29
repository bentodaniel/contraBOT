--CREATE DATABASE s1380_bot_db

CREATE TABLE Guilds (
    guildID VARCHAR(50) NOT NULL PRIMARY KEY,
    guildOwnerID VARCHAR(50) NOT NULL,
    defaultChannelID VARCHAR(50) NULL DEFAULT NULL,
    lastPatchID INT NOT NULL DEFAULT '0'
);

CREATE TABLE UpdatesChannels (
    gameID VARCHAR(100) NOT NULL,
    channelID VARCHAR(50) NOT NULL,
    guildID VARCHAR(50) NOT NULL,
    FOREIGN KEY (guildID) 
        REFERENCES Guilds(guildID)
        ON DELETE CASCADE
);

ALTER TABLE `UpdatesChannels` ADD UNIQUE `unique_index`(`gameID`, `guildID`);

CREATE TABLE LastUpdates (
    gameID VARCHAR(50) NOT NULL PRIMARY KEY,
    updateLink VARCHAR(255) NOT NULL,
    setDate DATE NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE WishList (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    userID VARCHAR(100) NOT NULL,
    gameID VARCHAR(100) NOT NULL,
    gameProductID VARCHAR(50) NOT NULL,
    gameLink VARCHAR(255) NOT NULL,
    gameImageLink VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL,
    receiveNotifications BOOLEAN NOT NULL DEFAULT true,
    store VARCHAR(50) NOT NULL DEFAULT 'allkeyshop',
    addDate DATE NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

ALTER TABLE `WishList` ADD UNIQUE `unique_index`(`userID`, `gameProductID`);

CREATE TABLE PricesNotified (
    wishlistID INT NOT NULL,
    offerLink VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL,
    addDate DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wishlistID) 
        REFERENCES WishList(id)
        ON DELETE CASCADE
);

CREATE TABLE PremiumUsers (
    userID VARCHAR(100) NOT NULL PRIMARY KEY
);
