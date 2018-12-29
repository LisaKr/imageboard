(function() {
    ///////////IMAGE MODAL COMPONENT//////////////////
    ////////////////////////////////////////
    Vue.component("pop-up", {
        template: "#my-template",

        props: ["id"],

        data: function() {
            return {
                image: {
                    title: "",
                    description: "",
                    username: "",
                    url: "",
                    created_at: new Date(""),
                    id: null,
                    next_id: null,
                    prev_id: null
                },

                addedComment: {
                    username: "",
                    commentText: ""
                },

                comments: [],

                replies: [],

                commentsShown: false,

                addedReply: {
                    username: "",
                    replyText: "",
                    comment_id: null
                },

                repliesShown: false,

                replyFormShown: false,

                showReplyButton: true,

                commentID: 0
            };
        },
        //which props to listen for changes in?
        watch: {
            id: function() {
                var self = this;
                console.log("watcher running!", this.id);
                self.replyFormShown = false;
                self.repliesShown = false;
                self.showReplyButton = true;
                self.commentsShown = false;

                axios
                    .get("/images/" + self.id)
                    .then(function(res) {
                        self.image = res.data;
                        axios.get("/comments/" + self.id).then(function(res) {
                            self.comments = res.data;
                            axios
                                .get("/replies/" + self.id)
                                .then(function(res) {
                                    self.replies = res.data;
                                });
                        });
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            }
        },

        mounted: function() {
            //this happens when the component is inserted into my page
            var self = this;

            axios
                .get("/images/" + this.id)
                .then(function(res) {
                    self.image = res.data;
                    axios.get("/comments/" + self.id).then(function(res) {
                        self.comments = res.data;
                        axios.get("/replies/" + self.id).then(function(res) {
                            self.replies = res.data;
                            console.log("repliesShown", self.repliesShown);
                        });
                    });
                })
                .catch(function(err) {
                    console.log(err);
                });
        },

        methods: {
            closeComponent() {
                this.$emit("close-it");
            },

            sendComment(e) {
                var self = this;
                e.preventDefault();
                axios
                    .post("/add-comment", {
                        comment: this.addedComment.commentText,
                        username: this.addedComment.username,
                        image_id: this.image.id
                    })
                    .then(function(res) {
                        self.comments.unshift(res.data);
                        self.addedComment = {};
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            },

            getNeighbor(e) {
                var clickedID = e.target.id;
                axios
                    .get("/images/" + clickedID)
                    .then(function(res) {
                        console.log("DATA", res.data, res.data.id);
                        self.image = res.data;
                        console.log("IMAGE", self.image, self.image.id);
                        axios.get("/comments/" + clickedID).then(function(res) {
                            self.comments = res.data;
                        });
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            },

            showComments() {
                this.commentsShown = true;
            },
            hideComments() {
                this.commentsShown = false;
            },

            showReplyForm(e) {
                this.replyFormShown = true;
                this.showReplyButton = false;
                this.commentID = e.target.id;
                console.log("COMMENID", this.commentID);
            },

            hideReplyForm() {
                this.replyFormShown = false;
                this.showReplyButton = true;
            },

            addReply(e) {
                var self = this;
                e.preventDefault();
                axios
                    .post("/add-reply", {
                        reply: this.addedReply.replyText,
                        username: this.addedReply.username,
                        image_id: this.image.id,
                        comment_id: e.target.id
                    })
                    .then(function(res) {
                        self.replies.unshift(res.data);
                        self.addedReply = {};
                        self.replyFormShown = false;
                        self.showReplyButton = true;
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            },

            showReplies(data) {
                this.commentID = data;
                console.log("AAAA", this.commentID);
                console.log("comment id", this.commentID);
                this.repliesShown = true;
                this.showReplyButton = false;
            },

            hideReplies() {
                this.repliesShown = false;
                this.showReplyButton = true;
            }
        }
    });
    ///////////////END OF IMAGE MODAL COMPONENT//////////////////////
    ////////////////////////////////////////////////////////////////


    //////////////////////////MAIN VUE INSTANCE///////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////
    new Vue({
        el: "#main",
        //all the information we want rendered on the screen. all logic and information we need for our app to work
        data: {
            //for the images from the database
            images: [],
            //for the input fields
            form: {
                title: "",
                description: "",
                username: "",
                file: null
            },

            //this will be changed when we click on the image in main
            idOfImagethatWasClicked: location.hash.slice(1) || 0,

            thereAreMorePics: true,

            menuIsShown: false
        },
        //what happens on page load
        mounted: function() {
            var self = this;

            window.addEventListener("hashchange", function() {
                self.idOfImagethatWasClicked = location.hash.slice(1);
            });

            axios
                .get("/get-images")
                .then(function(res) {
                    //assigning the images from the db to data (like state)
                    self.images = res.data;
                    //to prevent the more button from showing if my first batch of pics is less than 8 or 8
                    //if there are no images at all
                    if (self.images.length == 0) {
                        self.thereAreMorePics = false;
                    }
                    //on page load
                    var lastID = self.images[self.images.length - 1].id;
                    if (lastID == 1 && self.images.length <= 9) {
                        self.thereAreMorePics = false;
                    }
                })
                .catch(function(err) {
                    console.log(err);
                });
        }, //mounted ends here

        //every single function that runs in response to an event
        methods: {
            //accessing the file after the user chooses it
            handleFileChange: function(e) {
                //assign the file the user chose to the file object in our form so we can access it in the upload
                //function later
                this.form.file = e.target.files[0];
            },

            //function that runs when user clicks submit
            uploadFile: function(e) {
                e.preventDefault();
                var self = this;

                //formData to upload file to server. only because it is a file
                var formData = new FormData();
                formData.append("file", this.form.file);
                formData.append("title", this.form.title);
                formData.append("description", this.form.description);
                formData.append("username", this.form.username);

                axios
                    .post("/upload", formData)
                    .then(function(res) {
                        self.images.unshift(res.data);
                        self.form = {};
                        document.getElementById("test").value = "";
                        self.menuIsShown = false;
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            },

            toggleComponent: function(e) {
                //we have added the id property to every image so now when we click it we can take it from the e.target
                this.idOfImagethatWasClicked = e.target.id;
            },

            closingIt: function() {
                this.idOfImagethatWasClicked = null;
            },

            getMorePictures() {
                var self = this;
                var lastID = this.images[this.images.length - 1].id;

                axios.get("/get-more-images/" + lastID).then(function(resp) {
                    self.images.push.apply(self.images, resp.data);
                    lastID = self.images[self.images.length - 1].id;
                    if (lastID == 1) {
                        self.thereAreMorePics = false;
                    }
                });
            },

            showMenu() {
                this.menuIsShown = true;
            },

            closeMenu() {
                this.menuIsShown = false;
            }
        }
    });
})();
