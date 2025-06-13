import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';

/**
 * Represents a message that can be listed on a board.
 */
class Message {
   id: string;
   title: string;
   body: string;
   attachmentURL: string;
   createdAt: Date;
   updatedAt: Date | null;
}

const messagesStorage = StableBTreeMap<string, Message>(0);

const app = express();
app.use(express.json());

app.post("/messages", (req, res) => {
   const message: Message = { id: uuidv4(), createdAt: getCurrentDate(), ...req.body };
   messagesStorage.insert(message.id, message);
   res.json(message);
});

app.get("/messages", (req, res) => {
   res.json(messagesStorage.values());
});

app.get("/messages/:id", (req, res) => {
   const messageId = req.params.id;
   const messageOpt = messagesStorage.get(messageId);
   if ("None" in messageOpt) {
      res.status(404).send(`The message with id=${messageId} not found`);
   } else {
      res.json(messageOpt.Some);
   }
});

app.put("/messages/:id", (req, res) => {
   const messageId = req.params.id;
   const messageOpt = messagesStorage.get(messageId);
   if ("None" in messageOpt) {
      res.status(400).send(`Couldn't update a message with id=${messageId}. Message not found`);
   } else {
      const message = messageOpt.Some;
      const updatedMessage = { ...message, ...req.body, updatedAt: getCurrentDate() };
      messagesStorage.insert(message.id, updatedMessage);
      res.json(updatedMessage);
   }
});

app.delete("/messages/:id", (req, res) => {
   const messageId = req.params.id;
   const deletedMessage = messagesStorage.remove(messageId);
   if ("None" in deletedMessage) {
      res.status(400).send(`Couldn't delete a message with id=${messageId}. Message not found`);
   } else {
      res.json(deletedMessage.Some);
   }
});

const server = Server(() => app.listen(3000));

function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}

export default server;
