// ===== Geometric Chess - Complete Chess Engine and Game Logic =====

// ===== Chess Engine =====
class ChessEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = this.createStartingBoard();
        this.turn = 'white';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameState = { status: 'playing' };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.positionHistory = [];
        this.kingPositions = { white: 'e1', black: 'e8' };
    }

    createStartingBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'p', color: 'black' };
            board[6][i] = { type: 'p', color: 'white' };
        }
        board[0][0] = { type: 'r', color: 'black' };
        board[0][7] = { type: 'r', color: 'black' };
        board[7][0] = { type: 'r', color: 'white' };
        board[7][7] = { type: 'r', color: 'white' };
        board[0][1] = { type: 'n', color: 'black' };
        board[0][6] = { type: 'n', color: 'black' };
        board[7][1] = { type: 'n', color: 'white' };
        board[7][6] = { type: 'n', color: 'white' };
        board[0][2] = { type: 'b', color: 'black' };
        board[0][5] = { type: 'b', color: 'black' };
        board[7][2] = { type: 'b', color: 'white' };
        board[7][5] = { type: 'b', color: 'white' };
        board[0][3] = { type: 'q', color: 'black' };
        board[7][3] = { type: 'q', color: 'white' };
        board[0][4] = { type: 'k', color: 'black' };
        board[7][4] = { type: 'k', color: 'white' };
        return board;
    }

    squareToIndices(square) {
        const file = square[0].charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = 8 - parseInt(square[1]);
        return { row: rank, col: file };
    }

    indicesToSquare(row, col) {
        const file = String.fromCharCode('a'.charCodeAt(0) + col);
        const rank = 8 - row;
        return file + rank;
    }

    getPiece(square) {
        const { row, col } = this.squareToIndices(square);
        return this.board[row][col];
    }

    getPieceAt(row, col) {
        return this.board[row][col];
    }

    setPiece(square, piece) {
        const { row, col } = this.squareToIndices(square);
        this.board[row][col] = piece;
    }

    setPieceAt(row, col, piece) {
        this.board[row][col] = piece;
    }

    isOnBoard(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isEmpty(square) {
        const piece = this.getPiece(square);
        return piece === null || piece === undefined;
    }

    isEmptyAt(row, col) {
        return this.board[row][col] === null || this.board[row][col] === undefined;
    }

    isOpponent(square, color) {
        const piece = this.getPiece(square);
        return piece !== null && piece !== undefined && piece.color !== color;
    }

    isOpponentAt(row, col, color) {
        const piece = this.board[row][col];
        return piece !== null && piece !== undefined && piece.color !== color;
    }

    isFriendly(square, color) {
        const piece = this.getPiece(square);
        return piece !== null && piece !== undefined && piece.color === color;
    }

    generateLegalMoves() {
        const moves = [];
        const color = this.turn;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const square = this.indicesToSquare(row, col);
                    const pieceMoves = this.generatePieceMoves(square);
                    moves.push(...pieceMoves);
                }
            }
        }
        return moves;
    }

    generatePieceMoves(square) {
        const piece = this.getPiece(square);
        if (!piece) return [];
        const color = piece.color;
        const moves = [];
        switch (piece.type) {
            case 'p': moves.push(...this.generatePawnMoves(square, color)); break;
            case 'n': moves.push(...this.generateKnightMoves(square, color)); break;
            case 'b': moves.push(...this.generateBishopMoves(square, color)); break;
            case 'r': moves.push(...this.generateRookMoves(square, color)); break;
            case 'q': moves.push(...this.generateQueenMoves(square, color)); break;
            case 'k': moves.push(...this.generateKingMoves(square, color)); break;
        }
        return moves.filter(move => !this.moveLeavesKingInCheck(move, color));
    }

    generatePawnMoves(square, color) {
        const moves = [];
        const { row, col } = this.squareToIndices(square);
        const direction = color === 'white' ? -1 : 1;
        if (this.isOnBoard(row + direction, col) && this.isEmptyAt(row + direction, col)) {
            moves.push({ from: square, to: this.indicesToSquare(row + direction, col), type: 'normal' });
            const startRow = color === 'white' ? 6 : 1;
            if (row === startRow && this.isEmptyAt(row + 2 * direction, col)) {
                moves.push({ from: square, to: this.indicesToSquare(row + 2 * direction, col), type: 'double-pawn' });
            }
        }
        for (const dc of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dc;
            if (this.isOnBoard(newRow, newCol)) {
                if (this.isOpponentAt(newRow, newCol, color)) {
                    moves.push({ from: square, to: this.indicesToSquare(newRow, newCol), type: 'capture' });
                }
                if (this.enPassantTarget) {
                    const { row: epRow, col: epCol } = this.squareToIndices(this.enPassantTarget);
                    if (newRow === epRow && newCol === epCol) {
                        moves.push({ from: square, to: this.enPassantTarget, type: 'en-passant' });
                    }
                }
            }
        }
        return moves;
    }

    generateKnightMoves(square, color) {
        const moves = [];
        const { row, col } = this.squareToIndices(square);
        const knightOffsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of knightOffsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isOnBoard(newRow, newCol)) {
                if (this.isEmptyAt(newRow, newCol)) {
                    moves.push({ from: square, to: this.indicesToSquare(newRow, newCol), type: 'normal' });
                } else if (this.isOpponentAt(newRow, newCol, color)) {
                    moves.push({ from: square, to: this.indicesToSquare(newRow, newCol), type: 'capture' });
                }
            }
        }
        return moves;
    }

    generateBishopMoves(square, color) {
        return this.generateSlidingMoves(square, color, [[-1,-1],[-1,1],[1,-1],[1,1]]);
    }

    generateRookMoves(square, color) {
        return this.generateSlidingMoves(square, color, [[-1,0],[1,0],[0,-1],[0,1]]);
    }

    generateQueenMoves(square, color) {
        return this.generateSlidingMoves(square, color, [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]);
    }

    generateSlidingMoves(square, color, directions) {
        const moves = [];
        const { row, col } = this.squareToIndices(square);
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            while (this.isOnBoard(newRow, newCol)) {
                if (this.isEmptyAt(newRow, newCol)) {
                    moves.push({ from: square, to: this.indicesToSquare(newRow, newCol), type: 'normal' });
                } else if (this.isOpponentAt(newRow, newCol, color)) {
                    moves.push({ from: square, to: this.indicesToSquare(newRow, newCol), type: 'capture' });
                    break;
                } else {
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
        return moves;
    }

    generateKingMoves(square, color) {
        const moves = [];
        const { row, col } = this.squareToIndices(square);
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isOnBoard(newRow, newCol)) {
                    if (this.isEmptyAt(newRow, newCol)) {
                        moves.push({ from: square, to: this.indicesToSquare(newRow, newCol), type: 'normal' });
                    } else if (this.isOpponentAt(newRow, newCol, color)) {
                        moves.push({ from: square, to: this.indicesToSquare(newRow, newCol), type: 'capture' });
                    }
                }
            }
        }
        const rights = this.castlingRights[color];
        const kingRow = color === 'white' ? 7 : 0;
        if (rights.kingSide && !this.isEmptyAt(kingRow, 5) && !this.isEmptyAt(kingRow, 6)) {
            const f1 = this.indicesToSquare(kingRow, 5);
            const g1 = this.indicesToSquare(kingRow, 6);
            if (!this.squareIsAttacked(f1, color) && !this.squareIsAttacked(g1, color)) {
                moves.push({ from: square, to: g1, type: 'castling', side: 'king' });
            }
        }
        if (rights.queenSide && !this.isEmptyAt(kingRow, 3) && !this.isEmptyAt(kingRow, 2) && !this.isEmptyAt(kingRow, 1)) {
            const d1 = this.indicesToSquare(kingRow, 3);
            const c1 = this.indicesToSquare(kingRow, 2);
            const b1 = this.indicesToSquare(kingRow, 1);
            if (!this.squareIsAttacked(d1, color) && !this.squareIsAttacked(c1, color) && !this.squareIsAttacked(b1, color)) {
                moves.push({ from: square, to: c1, type: 'castling', side: 'queen' });
            }
        }
        return moves;
    }

    moveLeavesKingInCheck(move, color) {
        const tempBoard = JSON.parse(JSON.stringify(this.board));
        const tempCastling = JSON.parse(JSON.stringify(this.castlingRights));
        const tempEnPassant = this.enPassantTarget;
        const tempKingPositions = JSON.parse(JSON.stringify(this.kingPositions));
        this.executeMove(move, true);
        const inCheck = this.isInCheck(color);
        this.board = JSON.parse(JSON.stringify(tempBoard));
        this.castlingRights = JSON.parse(JSON.stringify(tempCastling));
        this.enPassantTarget = tempEnPassant;
        this.kingPositions = JSON.parse(JSON.stringify(tempKingPositions));
        return inCheck;
    }

    squareIsAttacked(square, byColor) {
        const opponent = byColor === 'white' ? 'black' : 'white';
        const { row, col } = this.squareToIndices(square);
        const pawnDirection = opponent === 'white' ? -1 : 1;
        for (const dc of [-1, 1]) {
            const pawnRow = row + pawnDirection;
            const pawnCol = col + dc;
            if (this.isOnBoard(pawnRow, pawnCol)) {
                const piece = this.board[pawnRow][pawnCol];
                if (piece && piece.type === 'p' && piece.color === opponent) return true;
            }
        }
        const knightOffsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of knightOffsets) {
            const knightRow = row + dr;
            const knightCol = col + dc;
            if (this.isOnBoard(knightRow, knightCol)) {
                const piece = this.board[knightRow][knightCol];
                if (piece && piece.type === 'n' && piece.color === opponent) return true;
            }
        }
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const kingRow = row + dr;
                const kingCol = col + dc;
                if (this.isOnBoard(kingRow, kingCol)) {
                    const piece = this.board[kingRow][kingCol];
                    if (piece && piece.type === 'k' && piece.color === opponent) return true;
                }
            }
        }
        const slidingDirections = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, dc] of slidingDirections) {
            let newRow = row + dr;
            let newCol = col + dc;
            while (this.isOnBoard(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (piece) {
                    if (piece.color === opponent) {
                        if (piece.type === 'q') return true;
                        if (dr !== 0 && dc !== 0 && (piece.type === 'b' || piece.type === 'q')) return true;
                        if ((dr === 0 || dc === 0) && (piece.type === 'r' || piece.type === 'q')) return true;
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
        return false;
    }

    isInCheck(color) {
        const kingPos = this.kingPositions[color];
        if (!kingPos) return false;
        return this.squareIsAttacked(kingPos, color);
    }

    executeMove(move, isTemporary = false) {
        const { from, to, type } = move;
        const piece = this.getPiece(from);
        if (!piece) return false;
        const { row: fromRow, col: fromCol } = this.squareToIndices(from);
        const { row: toRow, col: toCol } = this.squareToIndices(to);
        if (!isTemporary) this.saveState();
        switch (type) {
            case 'normal':
                this.board[toRow][toCol] = { ...piece };
                this.board[fromRow][fromCol] = null;
                if (piece.type === 'k') this.kingPositions[piece.color] = to;
                break;
            case 'capture':
                const capturedPiece = this.board[toRow][toCol];
                if (capturedPiece) this.capturedPieces[piece.color].push(capturedPiece);
                this.board[toRow][toCol] = { ...piece };
                this.board[fromRow][fromCol] = null;
                if (piece.type === 'k') this.kingPositions[piece.color] = to;
                break;
            case 'en-passant':
                const capturedPawnRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
                const capturedPawnCol = toCol;
                this.capturedPieces[piece.color].push(this.board[capturedPawnRow][capturedPawnCol]);
                this.board[capturedPawnRow][capturedPawnCol] = null;
                this.board[toRow][toCol] = { ...piece };
                this.board[fromRow][fromCol] = null;
                break;
            case 'castling':
                this.handleCastling(move, piece);
                break;
            case 'double-pawn':
                this.board[toRow][toCol] = { ...piece };
                this.board[fromRow][fromCol] = null;
                const epRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
                this.enPassantTarget = this.indicesToSquare(epRow, toCol);
                break;
        }
        this.updateCastlingRights(piece, from, to);
        if (type !== 'double-pawn') this.enPassantTarget = null;
        if (piece.type === 'p' || type === 'capture') this.halfMoveClock = 0;
        else this.halfMoveClock++;
        if (piece.color === 'black') this.fullMoveNumber++;
        if (!isTemporary) this.turn = piece.color === 'white' ? 'black' : 'white';
        this.savePosition();
        return true;
    }

    handleCastling(move, piece) {
        const { from, to, side } = move;
        const { row: toRow, col: toCol } = this.squareToIndices(to);
        const { row: fromRow } = this.squareToIndices(from);
        this.board[toRow][toCol] = { ...piece };
        this.board[fromRow][4] = null;
        this.kingPositions[piece.color] = to;
        if (side === 'king') {
            const rookFrom = this.indicesToSquare(fromRow, 7);
            const rookTo = this.indicesToSquare(fromRow, 5);
            const rook = this.getPiece(rookFrom);
            this.board[fromRow][5] = { ...rook };
            this.board[fromRow][7] = null;
        } else {
            const rookFrom = this.indicesToSquare(fromRow, 0);
            const rookTo = this.indicesToSquare(fromRow, 3);
            const rook = this.getPiece(rookFrom);
            this.board[fromRow][3] = { ...rook };
            this.board[fromRow][0] = null;
        }
    }

    updateCastlingRights(piece, from, to) {
        if (piece.type === 'k') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        } else if (piece.type === 'r') {
            const { row, col } = this.squareToIndices(from);
            const color = piece.color;
            if (col === 0) this.castlingRights[color].queenSide = false;
            else if (col === 7) this.castlingRights[color].kingSide = false;
            const toCol = this.squareToIndices(to).col;
            if (toCol === 0) this.castlingRights[color].queenSide = false;
            else if (toCol === 7) this.castlingRights[color].kingSide = false;
        }
    }

    saveState() {
        this.moveHistory.push({
            board: JSON.parse(JSON.stringify(this.board)),
            turn: this.turn,
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            enPassantTarget: this.enPassantTarget,
            kingPositions: JSON.parse(JSON.stringify(this.kingPositions)),
            capturedPieces: JSON.parse(JSON.stringify(this.capturedPieces)),
            halfMoveClock: this.halfMoveClock,
            fullMoveNumber: this.fullMoveNumber
        });
    }

    savePosition() {
        const positionKey = this.generatePositionKey();
        this.positionHistory.push(positionKey);
    }

    generatePositionKey() {
        let key = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) key += piece.color[0] + piece.type;
                else key += 'x';
            }
            key += '/';
        }
        key += this.turn + ' ';
        key += (this.castlingRights.white.kingSide ? 'K' : '') + (this.castlingRights.white.queenSide ? 'Q' : '') + (this.castlingRights.black.kingSide ? 'k' : '') + (this.castlingRights.black.queenSide ? 'q' : '') + ' ';
        key += (this.enPassantTarget || '-') + ' ';
        key += this.halfMoveClock + ' ';
        key += this.fullMoveNumber;
        return key;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return false;
        const lastState = this.moveHistory.pop();
        this.board = JSON.parse(JSON.stringify(lastState.board));
        this.turn = lastState.turn;
        this.castlingRights = JSON.parse(JSON.stringify(lastState.castlingRights));
        this.enPassantTarget = lastState.enPassantTarget;
        this.kingPositions = JSON.parse(JSON.stringify(lastState.kingPositions));
        this.capturedPieces = JSON.parse(JSON.stringify(lastState.capturedPieces));
        this.halfMoveClock = lastState.halfMoveClock;
        this.fullMoveNumber = lastState.fullMoveNumber;
        this.positionHistory.pop();
        return true;
    }

    isCheckmate() {
        const color = this.turn;
        if (!this.isInCheck(color)) return false;
        const legalMoves = this.generateLegalMoves();
        return legalMoves.length === 0;
    }

    isStalemate() {
        const color = this.turn;
        if (this.isInCheck(color)) return false;
        const legalMoves = this.generateLegalMoves();
        return legalMoves.length === 0;
    }

    isInsufficientMaterial() {
        let whitePieces = [];
        let blackPieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.color === 'white') whitePieces.push(piece.type);
                    else blackPieces.push(piece.type);
                }
            }
        }
        if (whitePieces.length === 1 && whitePieces[0] === 'k' && blackPieces.length === 1 && blackPieces[0] === 'k') return true;
        if (whitePieces.length === 2 && whitePieces.includes('k') && whitePieces.includes('b') && blackPieces.length === 1 && blackPieces[0] === 'k') return true;
        if (blackPieces.length === 2 && blackPieces.includes('k') && blackPieces.includes('b') && whitePieces.length === 1 && whitePieces[0] === 'k') return true;
        if (whitePieces.length === 2 && whitePieces.includes('k') && whitePieces.includes('n') && blackPieces.length === 1 && blackPieces[0] === 'k') return true;
        if (blackPieces.length === 2 && blackPieces.includes('k') && blackPieces.includes('n') && whitePieces.length === 1 && whitePieces[0] === 'k') return true;
        if (whitePieces.length === 2 && whitePieces.includes('k') && whitePieces.includes('b') && blackPieces.length === 2 && blackPieces.includes('k') && blackPieces.includes('b')) {
            let whiteBishopColor = null, blackBishopColor = null;
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const piece = this.board[row][col];
                    if (piece && piece.type === 'b') {
                        const color = (row + col) % 2 === 0 ? 'light' : 'dark';
                        if (piece.color === 'white') whiteBishopColor = color;
                        else blackBishopColor = color;
                    }
                }
            }
            if (whiteBishopColor && blackBishopColor && whiteBishopColor === blackBishopColor) return true;
        }
        return false;
    }

    isThreefoldRepetition() {
        const currentPosition = this.generatePositionKey();
        const count = this.positionHistory.filter(pos => pos === currentPosition).length;
        return count >= 3;
    }

    isFiftyMoveRule() {
        return this.halfMoveClock >= 50;
    }

    isSeventyFiveMoveRule() {
        return this.halfMoveClock >= 75;
    }

    isDraw() {
        return this.isStalemate() || this.isInsufficientMaterial() || this.isThreefoldRepetition() || this.isFiftyMoveRule() || this.isSeventyFiveMoveRule();
    }

    getGameStatus() {
        if (this.isCheckmate()) {
            const winner = this.turn === 'white' ? 'black' : 'white';
            return { status: 'checkmate', winner };
        }
        if (this.isStalemate()) return { status: 'stalemate' };
        if (this.isInsufficientMaterial()) return { status: 'draw', reason: 'insufficient material' };
        if (this.isThreefoldRepetition()) return { status: 'draw', reason: 'threefold repetition' };
        if (this.isFiftyMoveRule()) return { status: 'draw', reason: 'fifty-move rule' };
        if (this.isInCheck(this.turn)) return { status: 'check', color: this.turn };
        return { status: 'playing', turn: this.turn };
    }
}

// ===== AI Opponent =====
class ChessAI {
    constructor(engine) {
        this.engine = engine;
        this.difficulty = 3;
    }

    setDifficulty(level) {
        this.difficulty = Math.max(1, Math.min(5, level));
    }

    findBestMove() {
        const depth = this.difficulty;
        const bestMove = this.minimax(this.engine, depth, -Infinity, Infinity, true);
        return bestMove;
    }

    minimax(engine, depth, alpha, beta, isMaximizing) {
        const status = engine.getGameStatus();
        if (status.status === 'checkmate') return isMaximizing ? -10000 : 10000;
        if (status.status === 'stalemate' || status.status === 'draw') return 0;
        if (depth === 0) return this.evaluateBoard(engine);
        const color = isMaximizing ? 'black' : 'white';
        const legalMoves = engine.generateLegalMoves();
        if (legalMoves.length === 0) {
            if (engine.isInCheck(color)) return isMaximizing ? -10000 : 10000;
            return 0;
        }
        let bestValue = isMaximizing ? -Infinity : Infinity;
        let bestMove = null;
        const sortedMoves = this.sortMoves(engine, legalMoves, isMaximizing);
        for (const move of sortedMoves) {
            const originalBoard = JSON.parse(JSON.stringify(engine.board));
            const originalTurn = engine.turn;
            const originalCastling = JSON.parse(JSON.stringify(engine.castlingRights));
            const originalEnPassant = engine.enPassantTarget;
            const originalKingPositions = JSON.parse(JSON.stringify(engine.kingPositions));
            const originalCaptured = JSON.parse(JSON.stringify(engine.capturedPieces));
            const originalHalfMove = engine.halfMoveClock;
            const originalFullMove = engine.fullMoveNumber;
            engine.executeMove(move, false);
            const value = this.minimax(engine, depth - 1, alpha, beta, !isMaximizing);
            engine.board = JSON.parse(JSON.stringify(originalBoard));
            engine.turn = originalTurn;
            engine.castlingRights = JSON.parse(JSON.stringify(originalCastling));
            engine.enPassantTarget = originalEnPassant;
            engine.kingPositions = JSON.parse(JSON.stringify(originalKingPositions));
            engine.capturedPieces = JSON.parse(JSON.stringify(originalCaptured));
            engine.halfMoveClock = originalHalfMove;
            engine.fullMoveNumber = originalFullMove;
            engine.positionHistory.pop();
            if (isMaximizing) {
                if (value > bestValue) { bestValue = value; bestMove = move; }
                alpha = Math.max(alpha, value);
                if (beta <= alpha) break;
            } else {
                if (value < bestValue) { bestValue = value; bestMove = move; }
                beta = Math.min(beta, value);
                if (beta <= alpha) break;
            }
        }
        return depth === this.difficulty ? bestMove : bestValue;
    }

    evaluateBoard(engine) {
        let score = 0;
        const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = engine.board[row][col];
                if (piece) {
                    const value = pieceValues[piece.type];
                    score += piece.color === 'black' ? value : -value;
                }
            }
        }
        score += this.evaluatePosition(engine, 'black');
        score -= this.evaluatePosition(engine, 'white');
        const blackMoves = this.countLegalMoves(engine, 'black');
        const whiteMoves = this.countLegalMoves(engine, 'white');
        score += (blackMoves - whiteMoves) * 10;
        score += this.evaluateKingSafety(engine, 'black');
        score -= this.evaluateKingSafety(engine, 'white');
        score += this.evaluatePawnStructure(engine, 'black');
        score -= this.evaluatePawnStructure(engine, 'white');
        return score;
    }

    countLegalMoves(engine, color) {
        const originalTurn = engine.turn;
        engine.turn = color;
        const moves = engine.generateLegalMoves().length;
        engine.turn = originalTurn;
        return moves;
    }

    evaluatePosition(engine, color) {
        let score = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = engine.board[row][col];
                if (piece && piece.color === color) {
                    score += this.getPieceSquareValue(piece.type, row, col, color);
                }
            }
        }
        return score;
    }

    getPieceSquareValue(type, row, col, color) {
        const colIndex = col;
        const rowIndex = 7 - row;
        switch (type) {
            case 'p': return this.pawnPositionTable[rowIndex][colIndex];
            case 'n': return this.knightPositionTable[rowIndex][colIndex];
            case 'b': return this.bishopPositionTable[rowIndex][colIndex];
            case 'r': return this.rookPositionTable[rowIndex][colIndex];
            case 'q': return this.queenPositionTable[rowIndex][colIndex];
            case 'k': return this.kingPositionTable[rowIndex][colIndex];
            default: return 0;
        }
    }

    pawnPositionTable = [
        [0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]
    ];
    knightPositionTable = [
        [-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]
    ];
    bishopPositionTable = [
        [-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,10,10,10,10,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,5,5,5,5,-10],[-10,0,5,0,0,5,0,-10],[-20,-10,-10,-10,-10,-10,-10,-20]
    ];
    rookPositionTable = [
        [0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]
    ];
    queenPositionTable = [
        [-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]
    ];
    kingPositionTable = [
        [-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]
    ];

    evaluateKingSafety(engine, color) {
        const kingPos = engine.kingPositions[color];
        if (!kingPos) return 0;
        const { row, col } = engine.squareToIndices(kingPos);
        let safeSquares = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (engine.isOnBoard(newRow, newCol)) {
                    const square = engine.indicesToSquare(newRow, newCol);
                    if (!engine.squareIsAttacked(square, color)) safeSquares++;
                }
            }
        }
        return safeSquares * 10;
    }

    evaluatePawnStructure(engine, color) {
        let score = 0;
        const opponent = color === 'white' ? 'black' : 'white';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = engine.board[row][col];
                if (piece && piece.type === 'p' && piece.color === color) {
                    if (col > 0 && engine.board[row][col - 1] && engine.board[row][col - 1].type === 'p' && engine.board[row][col - 1].color === color) score -= 5;
                    if (col < 7 && engine.board[row][col + 1] && engine.board[row][col + 1].type === 'p' && engine.board[row][col + 1].color === color) score -= 5;
                    const hasNeighbor = (col > 0 && engine.board[row][col - 1] && engine.board[row][col - 1].type === 'p' && engine.board[row][col - 1].color === color) || (col < 7 && engine.board[row][col + 1] && engine.board[row][col + 1].type === 'p' && engine.board[row][col + 1].color === color);
                    if (!hasNeighbor) score -= 10;
                    const direction = color === 'white' ? -1 : 1;
                    let isPassed = true;
                    let checkRow = row + direction;
                    while (engine.isOnBoard(checkRow, col)) {
                        const p = engine.board[checkRow][col];
                        if (p && p.type === 'p' && p.color === opponent) { isPassed = false; break; }
                        if (p && p.type !== 'p') break;
                        checkRow += direction;
                    }
                    if (isPassed) score += 20;
                }
            }
        }
        return score;
    }

    sortMoves(engine, moves, isMaximizing) {
        return moves.sort((a, b) => {
            if (a.type === 'capture' && b.type !== 'capture') return -1;
            if (a.type !== 'capture' && b.type === 'capture') return 1;
            const tempEngineA = this.cloneEngine(engine);
            tempEngineA.executeMove(a, false);
            const isCheckmateA = tempEngineA.isCheckmate();
            const tempEngineB = this.cloneEngine(engine);
            tempEngineB.executeMove(b, false);
            const isCheckmateB = tempEngineB.isCheckmate();
            if (isCheckmateA && !isCheckmateB) return -1;
            if (!isCheckmateA && isCheckmateB) return 1;
            const isCheckA = tempEngineA.isInCheck(tempEngineA.turn);
            const isCheckB = tempEngineB.isInCheck(tempEngineB.turn);
            if (isCheckA && !isCheckB) return -1;
            if (!isCheckA && isCheckB) return 1;
            if (a.type === 'capture' && b.type === 'capture') {
                const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
                const aValue = pieceValues[engine.getPieceAt(...Object.values(engine.squareToIndices(a.to))).type] || 0;
                const bValue = pieceValues[engine.getPieceAt(...Object.values(engine.squareToIndices(b.to))).type] || 0;
                return isMaximizing ? bValue - aValue : aValue - bValue;
            }
            return 0;
        });
    }

    cloneEngine(engine) {
        const clone = new ChessEngine();
        clone.board = JSON.parse(JSON.stringify(engine.board));
        clone.turn = engine.turn;
        clone.castlingRights = JSON.parse(JSON.stringify(engine.castlingRights));
        clone.enPassantTarget = engine.enPassantTarget;
        clone.kingPositions = JSON.parse(JSON.stringify(engine.kingPositions));
        clone.capturedPieces = JSON.parse(JSON.stringify(engine.capturedPieces));
        clone.halfMoveClock = engine.halfMoveClock;
        clone.fullMoveNumber = engine.fullMoveNumber;
        return clone;
    }
}

// ===== Game UI Controller =====
class ChessGame {
    constructor() {
        this.engine = new ChessEngine();
        this.ai = new ChessAI(this.engine);
        this.selectedSquare = null;
        this.legalMoves = [];
        this.isFlipped = false;
        this.isAnimating = false;
        this.gameOver = false;
        this.boardElement = document.getElementById('board');
        this.boardContainer = document.getElementById('board-container');
        this.fileCoords = document.getElementById('file-coords');
        this.rankCoords = document.getElementById('rank-coords');
        this.statusText = document.getElementById('status-text');
        this.movesList = document.getElementById('moves-list');
        this.humanCaptured = document.getElementById('human-captured');
        this.aiCaptured = document.getElementById('ai-captured');
        this.promotionModal = document.getElementById('promotion-modal');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.flipBtn = document.getElementById('flip-btn');
        this.difficultySelect = document.getElementById('difficulty');
        this.init();
    }

    init() {
        this.createBoard();
        this.createCoordinates();
        this.bindEvents();
        this.updateStatus();
        this.renderBoard();
        this.ai.setDifficulty(parseInt(this.difficultySelect.value));
    }

    createBoard() {
        this.boardElement.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.addEventListener('click', (e) => this.handleSquareClick(row, col));
                this.boardElement.appendChild(square);
            }
        }
    }

    createCoordinates() {
        this.fileCoords.innerHTML = '';
        for (let col = 0; col < 8; col++) {
            const span = document.createElement('span');
            span.textContent = String.fromCharCode('a'.charCodeAt(0) + col);
            this.fileCoords.appendChild(span);
        }
        this.rankCoords.innerHTML = '';
        for (let row = 7; row >= 0; row--) {
            const span = document.createElement('span');
            span.textContent = 8 - row;
            this.rankCoords.appendChild(span);
        }
    }

    bindEvents() {
        this.boardElement.addEventListener('click', (e) => {
            if (e.target === this.boardElement) return;
            const square = e.target.closest('.square');
            if (square) {
                const row = parseInt(square.dataset.row);
                const col = parseInt(square.dataset.col);
                this.handleSquareClick(row, col);
            }
        });
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.undoBtn.addEventListener('click', () => this.undoMove());
        this.flipBtn.addEventListener('click', () => this.flipBoard());
        this.difficultySelect.addEventListener('change', () => this.ai.setDifficulty(parseInt(this.difficultySelect.value)));
        document.querySelectorAll('.promotion-option').forEach(btn => btn.addEventListener('click', () => this.completePromotion(btn.dataset.piece)));
        document.getElementById('game-over-close').addEventListener('click', () => { this.gameOverModal.classList.remove('active'); this.newGame(); });
    }

    handleSquareClick(row, col) {
        if (this.isAnimating || this.gameOver) return;
        const square = this.indicesToSquare(row, col);
        const piece = this.engine.getPieceAt(row, col);
        if (this.engine.turn === 'black') return;
        if (!this.selectedSquare) {
            if (piece && piece.color === 'white') {
                this.selectedSquare = square;
                this.legalMoves = this.engine.generatePieceMoves(square);
                this.renderBoard();
            }
            return;
        }
        if (this.selectedSquare === square) {
            this.selectedSquare = null; this.legalMoves = []; this.renderBoard(); return;
        }
        if (piece && piece.color === 'white') {
            this.selectedSquare = square; this.legalMoves = this.engine.generatePieceMoves(square); this.renderBoard(); return;
        }
        const move = this.legalMoves.find(m => m.to === square);
        if (move) this.executePlayerMove(move);
    }

    executePlayerMove(move) {
        const piece = this.engine.getPiece(move.from);
        if (piece && piece.type === 'p' && (move.to[1] === '8' || move.to[1] === '1')) {
            this.pendingPromotion = move; this.promotionModal.classList.add('active'); return;
        }
        this.executeMove(move);
    }

    completePromotion(pieceType) {
        if (!this.pendingPromotion) return;
        const move = this.pendingPromotion; move.promotion = pieceType;
        this.promotionModal.classList.remove('active'); this.pendingPromotion = null; this.executeMove(move);
    }

    executeMove(move) {
        this.isAnimating = true; this.selectedSquare = null; this.legalMoves = []; this.currentMove = move;
        this.animateMove(move);
    }

    animateMove(move) {
        const { from, to, type } = move;
        const piece = this.engine.getPiece(from);
        if (!piece) { this.isAnimating = false; return; }

        const fromSquare = this.boardElement.querySelector(`[data-row="${this.squareToIndices(from).row}"][data-col="${this.squareToIndices(from).col}"]`);
        const toSquare = this.boardElement.querySelector(`[data-row="${this.squareToIndices(to).row}"][data-col="${this.squareToIndices(to).col}"]`);
        const pieceElement = fromSquare.querySelector('.piece');

        if (pieceElement && fromSquare && toSquare) {
            pieceElement.classList.add('animating');
            const fromRect = fromSquare.getBoundingClientRect();
            const toRect = toSquare.getBoundingClientRect();
            const boardRect = this.boardContainer.getBoundingClientRect();

            const startX = fromRect.left + fromRect.width / 2 - boardRect.left;
            const startY = fromRect.top + fromRect.height / 2 - boardRect.top;
            const endX = toRect.left + toRect.width / 2 - boardRect.left;
            const endY = toRect.top + toRect.height / 2 - boardRect.top;

            pieceElement.style.position = 'fixed';
            pieceElement.style.left = startX + 'px';
            pieceElement.style.top = startY + 'px';
            pieceElement.style.width = fromRect.width * 0.85 + 'px';
            pieceElement.style.height = fromRect.height * 0.85 + 'px';
            pieceElement.style.zIndex = '1000';
            pieceElement.style.transform = 'translate(-50%, -50%)';

            setTimeout(() => {
                pieceElement.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
                pieceElement.style.left = endX + 'px';
                pieceElement.style.top = endY + 'px';

                if (type === 'capture' || type === 'en-passant') {
                    const capturedSquare = toSquare.querySelector('.piece');
                    if (capturedSquare) {
                        capturedSquare.classList.add('captured');
                        setTimeout(() => capturedSquare.remove(), 300);
                    }
                }

                setTimeout(() => {
                    pieceElement.remove();
                    this.engine.executeMove(move);
                    this.updateMoveHistory(); this.updateCapturedPieces(); this.updateStatus();
                    const status = this.engine.getGameStatus();
                    if (status.status === 'checkmate' || status.status === 'stalemate' || (status.status === 'draw' && !status.reason)) {
                        this.gameOver = true; this.showGameOver(status); this.isAnimating = false; return;
                    }
                    if (this.engine.turn === 'black') {
                        setTimeout(() => this.makeAIMove(), 500);
                    } else { this.isAnimating = false; }
                    this.renderBoard();
                }, 400);
            }, 10);
        } else {
            this.engine.executeMove(move);
            this.updateMoveHistory(); this.updateCapturedPieces(); this.updateStatus();
            const status = this.engine.getGameStatus();
            if (status.status === 'checkmate' || status.status === 'stalemate' || (status.status === 'draw' && !status.reason)) {
                this.gameOver = true; this.showGameOver(status); this.isAnimating = false; return;
            }
            if (this.engine.turn === 'black') {
                setTimeout(() => this.makeAIMove(), 500);
            } else { this.isAnimating = false; }
            this.renderBoard();
        }
    }

    makeAIMove() {
        if (this.gameOver) return;
        this.statusText.textContent = 'AI is thinking...'; this.statusText.className = 'status-text';
        setTimeout(() => {
            const move = this.ai.findBestMove();
            if (!move) {
                const status = this.engine.getGameStatus();
                if (status.status === 'checkmate' || status.status === 'stalemate' || (status.status === 'draw' && !status.reason)) {
                    this.gameOver = true; this.showGameOver(status);
                }
                this.isAnimating = false; this.updateStatus(); return;
            }
            const piece = this.engine.getPiece(move.from);
            if (piece && piece.type === 'p' && (move.to[1] === '8' || move.to[1] === '1')) move.promotion = 'queen';
            this.animateMove(move);
        }, 100);
    }

    updateStatus() {
        const status = this.engine.getGameStatus();
        switch (status.status) {
            case 'check': const player = status.color === 'white' ? 'Human' : 'AI'; this.statusText.textContent = player + ' king is in check'; this.statusText.className = 'status-text check'; break;
            case 'checkmate': const winner = status.winner === 'white' ? 'Human' : 'AI'; this.statusText.textContent = 'Checkmate! ' + winner + ' wins'; this.statusText.className = 'status-text checkmate'; break;
            case 'stalemate': this.statusText.textContent = 'Stalemate - Draw'; this.statusText.className = 'status-text stalemate'; break;
            case 'draw': this.statusText.textContent = 'Draw - ' + (status.reason || 'Agreed'); this.statusText.className = 'status-text stalemate'; break;
            default: const turn = status.turn === 'white' ? 'Human' : 'AI'; this.statusText.textContent = turn + ' to move'; this.statusText.className = 'status-text';
        }
        this.undoBtn.disabled = this.engine.moveHistory.length === 0;
    }

    showGameOver(status) {
        let title, message;
        switch (status.status) {
            case 'checkmate': const winner = status.winner === 'white' ? 'Human' : 'AI'; title = 'Checkmate!'; message = winner + ' wins by checkmate!'; break;
            case 'stalemate': title = 'Stalemate'; message = 'The game ends in a draw by stalemate.'; break;
            case 'draw': title = 'Draw'; message = 'Game ends in a draw: ' + (status.reason || 'Agreed'); break;
        }
        document.getElementById('game-over-title').textContent = title;
        document.getElementById('game-over-message').textContent = message;
        this.gameOverModal.classList.add('active');
    }

    updateMoveHistory() {
        const moves = this.engine.moveHistory;
        this.movesList.innerHTML = '';
        for (let i = 0; i < moves.length; i += 2) {
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';
            const moveNumber = document.createElement('span');
            moveNumber.className = 'move-number';
            moveNumber.textContent = Math.floor(i / 2) + 1 + '.';
            const whiteMove = document.createElement('span');
            whiteMove.className = 'white-move';
            whiteMove.textContent = this.formatMove(moves[i]);
            const blackMove = document.createElement('span');
            blackMove.className = 'black-move';
            if (moves[i + 1]) blackMove.textContent = this.formatMove(moves[i + 1]);
            moveEntry.appendChild(moveNumber);
            const movesSpan = document.createElement('span');
            movesSpan.className = 'moves';
            movesSpan.appendChild(whiteMove);
            if (moves[i + 1]) movesSpan.appendChild(blackMove);
            moveEntry.appendChild(movesSpan);
            this.movesList.appendChild(moveEntry);
        }
        this.movesList.scrollTop = this.movesList.scrollHeight;
    }

    formatMove(move) {
        if (!move) return '';
        const piece = move.piece || this.engine.getPiece(move.from);
        if (!piece) return '';
        let notation = '';
        if (piece.type !== 'p') notation += piece.type.toUpperCase();
        if (move.type === 'capture' && piece.type !== 'p') notation += move.from;
        if (move.type === 'capture' || move.type === 'en-passant') notation += 'x';
        notation += move.to;
        if (move.promotion) notation += '=' + move.promotion.toUpperCase();
        const status = this.engine.getGameStatus();
        if (status.status === 'check') notation += '+';
        else if (status.status === 'checkmate') notation += '#';
        return notation;
    }

    updateCapturedPieces() {
        this.humanCaptured.innerHTML = ''; this.aiCaptured.innerHTML = '';
        this.engine.capturedPieces.white.forEach(piece => this.humanCaptured.appendChild(this.createPieceElement(piece, 'ai')));
        this.engine.capturedPieces.black.forEach(piece => this.aiCaptured.appendChild(this.createPieceElement(piece, 'cream')));
    }

    createPieceElement(piece, side) {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece ' + side;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        const pieceMap = { 'k': 'king', 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight', 'p': 'pawn' };
        use.setAttribute('href', '#' + pieceMap[piece.type] + '-' + side);
        svg.appendChild(use); pieceElement.appendChild(svg);
        return pieceElement;
    }

    renderBoard() {
        const squares = this.boardElement.querySelectorAll('.square');
        squares.forEach(square => {
            const row = parseInt(square.dataset.row); const col = parseInt(square.dataset.col);
            const existingPiece = square.querySelector('.piece'); if (existingPiece) existingPiece.remove();
            square.classList.remove('highlight-legal', 'highlight-capture', 'highlight-selected', 'highlight-check', 'highlight-ai-thinking');
            const piece = this.engine.getPieceAt(row, col);
            if (piece) {
                const pieceElement = this.createPieceElement(piece, piece.color === 'white' ? 'cream' : 'ai');
                pieceElement.style.transform = 'translate(-50%, -50%)';
                pieceElement.classList.remove('animating');
                square.appendChild(pieceElement);
            }
            const squareName = this.indicesToSquare(row, col);
            if (this.selectedSquare === squareName) square.classList.add('highlight-selected');
            if (this.legalMoves.some(m => m.to === squareName)) {
                const move = this.legalMoves.find(m => m.to === squareName);
                if (move.type === 'capture' || move.type === 'en-passant') square.classList.add('highlight-capture');
                else square.classList.add('highlight-legal');
            }
            const status = this.engine.getGameStatus();
            if (status.status === 'check' && piece && piece.type === 'k' && piece.color === status.color) square.classList.add('highlight-check');
            if (this.engine.turn === 'black' && this.isAnimating) square.classList.add('highlight-ai-thinking');
        });
    }

    flipBoard() {
        this.isFlipped = !this.isFlipped;
        this.boardContainer.parentElement.classList.toggle('flipped', this.isFlipped);
        this.renderBoard();
    }

    newGame() {
        this.isAnimating = true;
        if (this.ai && this.ai.findBestMove) {
            this.ai.findBestMove = () => null;
        }
        this.engine.reset();
        this.ai = new ChessAI(this.engine);
        this.ai.setDifficulty(parseInt(this.difficultySelect.value));
        this.selectedSquare = null;
        this.legalMoves = [];
        this.isAnimating = false;
        this.gameOver = false;
        this.pendingPromotion = null;
        this.promotionModal.classList.remove('active');
        this.gameOverModal.classList.remove('active');
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateStatus();
        this.createBoard();
        this.createCoordinates();
        this.renderBoard();
    }

    undoMove() {
        if (this.engine.moveHistory.length === 0) return;
        this.engine.undoMove(); this.selectedSquare = null; this.legalMoves = []; this.gameOver = false;
        this.updateMoveHistory(); this.updateCapturedPieces(); this.updateStatus(); this.renderBoard();
    }

    indicesToSquare(row, col) {
        const file = String.fromCharCode('a'.charCodeAt(0) + col);
        const rank = 8 - row; return file + rank;
    }
}

document.addEventListener('DOMContentLoaded', () => new ChessGame());
