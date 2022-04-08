// SPDX-License-Identifier: LGPL
pragma solidity ^0.8.0;

abstract contract Constants {
    uint8 internal constant RAISE = 1;
    uint8 internal constant EXTESION = 2;
    uint8 internal constant CUT = 3;
    uint8 internal constant TERMINATION = 4;
    uint8 internal constant MAX_RECIPIENTS_PER_POOL = 10;
    uint64 internal constant A_MONTH = 30 * 24 * 60 * 60;
    uint64 internal constant COOL_OFF_PERIOD = A_MONTH;
}