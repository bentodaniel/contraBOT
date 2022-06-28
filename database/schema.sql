--CREATE DATABASE s1380_bot_db

CREATE TABLE Guilds (
    guildID VARCHAR(100) NOT NULL PRIMARY KEY,
    guildOwnerID VARCHAR(100) NOT NULL
);

CREATE TABLE UpdatesChannels (
    gameID VARCHAR(50) NOT NULL,
    channelID VARCHAR(100) NOT NULL,
    guildID VARCHAR(100) NOT NULL,
    FOREIGN KEY (guildID) 
        REFERENCES Guilds(guildID)
        ON DELETE CASCADE
);

ALTER TABLE `UpdatesChannels` ADD UNIQUE `unique_index`(`gameID`, `guildID`);

CREATE TABLE LastUpdates (
    gameID VARCHAR(50) NOT NULL PRIMARY KEY,
    updateLink VARCHAR(100) NOT NULL
);