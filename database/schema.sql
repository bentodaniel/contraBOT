--CREATE DATABASE s1380_bot_db

CREATE TABLE Guilds (
    guildID VARCHAR(50) NOT NULL PRIMARY KEY,
    guildOwnerID VARCHAR(50) NOT NULL,
    defaultChannelID VARCHAR(50) NULL DEFAULT NULL
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
    updateLink VARCHAR(255) NOT NULL
);

CREATE TABLE WishList (
    userID VARCHAR(100) NOT NULL,
    gameID VARCHAR(100) NOT NULL,
    gameProductID VARCHAR(50) NOT NULL,
    gameLink VARCHAR(255) NOT NULL,
    gameImageLink VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL,
    receiveNotifications BOOLEAN NOT NULL DEFAULT true,
    store VARCHAR(50) NOT NULL DEFAULT 'allkeyshop'
);

ALTER TABLE `WishList` ADD UNIQUE `unique_index`(`userID`, `gameProductID`);

CREATE TABLE PremiumUsers (
    userID VARCHAR(100) NOT NULL PRIMARY KEY,
);
