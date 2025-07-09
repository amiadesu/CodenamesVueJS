class SocketContext {
    constructor(socket) {
        this.socketId = socket.id;
        this.userData = socket.userData;
        this.userId = socket.userData.userID;
        this.userCodenamesId = socket.userData.codenamesID;
        this.user = null;
        this.roomId = "default";
        this.countdownInterval = null;
        this.timerInterval = null;
        this.status = {
            settedUp: false,
            setup_event: {
                active: false
            }
        };
    }
}
 
module.exports = SocketContext;