const express = require("express");
const bodyParser = require("body-parser");
//const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

try {
    mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
} catch (error) {
    console.log(error);
}

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Welcome!"
});

const item2 = new Item({
    name: "Add/delete items."
});

const item3 = new Item({
    name: "Add /<text> to URL for custom lists."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = new mongoose.model("List", listSchema);

//Populates default list only once, otherwise shows existing items from database.
app.get("/", async function(req, res) {
    const items = await Item.find({});
    if(items.length === 0) {
        Item.insertMany(defaultItems);
        res.redirect("/");
    } else {
        // list.ejs is in views folder, and the key value pair that matches in both files
        res.render("list", {listTitle: "Today", newListItems: items });
    }

});

//Custom lists go to a new page with it's own database.
app.get("/:listName", async function(req, res) {
    customListName = _.capitalize(req.params.listName);
    const query = await List.findOne({name: customListName});
    if(query === null) {
        const list = new List({
            name: customListName,
            items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
    } else {
        res.render("list", {listTitle: query.name, newListItems: query.items});
    }
});

//Todo items are added to specific list database and shown on page
app.post("/", async function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if(listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        const q = await List.findOne({name: listName});
        q.items.push(item);
        q.save();
        res.redirect("/" + listName);
    }

});

//Items are deleted from specified list and removed from page
app.post("/delete", async function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        const query = await Item.findByIdAndRemove(checkedItemId);
        if(query !== null) {
            console.log("Removed item");
        } else {
            console.log("Had trouble removing item.");
        }
        res.redirect("/");
    } else {
        const result = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
        if( result !== null) {
            console.log("Removed item");
            res.redirect("/" + listName);
        } else {
            console.log("Issue with list name or item id.");
        }
    }
});


app.listen(3000, function() {
    console.log("server running on port 3000");
});
