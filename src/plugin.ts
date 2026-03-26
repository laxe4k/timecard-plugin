import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { TimecardAction } from "./actions/timecard-action";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the timecard action.
streamDeck.actions.registerAction(new TimecardAction());

// Finally, connect to the Stream Deck.
streamDeck.connect();
