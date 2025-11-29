const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const generateAgoraToken = (channelName, uid, role = 'publisher') => {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const roleType = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        uid,
        roleType,
        privilegeExpiredTs
    );

    return token;
};

module.exports = { generateAgoraToken };

