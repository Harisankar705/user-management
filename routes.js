    // routes/userRoutes.js
    const express = require('express');
    const router = express.Router();
    const bcrypt = require('bcrypt');
    const db = require('./model/db');
    const User=require('./model/config');
    const session = require('express-session');
    const auth=require('./middleware/userAuth')
    const adminAuth=require('./middleware/AdminAuth')



        //session handling


    router.get('/',auth.isLogout, (req, res) => {
        res.render('login',{message:""});
    });

    router.get('/signup', auth.isLogout,(req, res) => {
        res.render('signup');
    });

    router.get('/adminlogin',adminAuth.isLogout, (req, res) => {
        res.render('adminlogin');
    });

    router.get('/dashboard', auth.isLogin, async (req, res) => {
        res.render('dashboard', { loggedInUser: User });
    })
    

    router.post('/signup', async (req, res) => {
        try {
            let { name, email, password } = req.body;
            if (password.length < 6) {
                res.render("signup", { alert: { type: "primary", message: "Password must be at least 6 characters" } });
                return;
            }
    
            const existingUser = await User.findOne({ name: name });
            const existingEmail = await User.findOne({ email: email });
    
            if (existingUser) {
                res.render('signup', { alert: { type: "primary", message: "User already exists. Try Login!" } });
                return;
            } else if (existingEmail) {
                res.render('signup', { alert: { type: "primary", message: "Email already exists. Try logging in!" } });
                return;
            } else {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
    
                const userData = new User({
                    name,
                    email,
                    password: hashedPassword
                });
    
                await userData.save();
                // Render signup success message before redirecting to login
                res.render('login', { alert: { type: "success", message: "Signup successful! Use the same email and password to login." } });
                return;
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });
    

    // router.get('/',(req,res)=>{
    //     if(!req.session.user)
    //     {
    //         res.render('login')
    //     }
    //     else{
    //         res.redirect('/dashboard')
    //     }
    // })
    router.post('/login', async (req, res) => {
        try {
            const loggedInUser = await User.findOne({ email: req.body.email });
            if (!loggedInUser) {
                res.render('login', { alert: { type: 'primary', message: 'User not found' } });
                return;
            }

            const isPasswordMatch = await bcrypt.compare(req.body.password, loggedInUser.password);
        
            if (isPasswordMatch) {
                req.session.user=loggedInUser
                console.log(req.session.user);
                res.render('dashboard',{loggedInUser})
            } else {
                res.render('login', { alert: { type: 'danger', message: 'Invalid password' } });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });

    //accessing the session varible in another route
    // router.get('/dashboard',(req,res)=>{
    //     const user=req.session.user
    //     if(!user)
    //     {
    //         res.redirect('/login')
    //         return
    //     }
    // })

    router.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
                res.status(500).send("Internal server error");
            } else {
                res.render('login', { alert: { type: "primary", message: 'Logout Success' } });
            }
        });
    });

    router.get('/adminlogout',(req,res)=>{
    try {
        req.session.admin=false
        res.redirect('/adminlogin')
    } catch (error) {
        console.log(error.message);
    }
        
    })




    const adminCredentials = {
        email: 'admin123@gmail.com',
        password: 'admin555'
    };
    router.post('/adminlogin', (req, res) => {
        const enteredEmail = req.body.email;
        const enteredPassword = req.body.password;
        if (enteredEmail !== adminCredentials.email || enteredPassword !== adminCredentials.password) {
            res.render('adminlogin', {
                alert: { type: 'primary', message: 'Username/password is incorrect' }
            });
        } else {
            req.session.admin={email:enteredEmail}
            res.redirect('/adminpanel');
        }
    });



    //get all user routes
    router.get('/adminpanel',adminAuth.isLogin,async(req,res)=>{
        try{
            const users=await User.find()
                res.render('adminpanel',{
                    users:users
                })
            
        }
        catch(err)
        {
            res.status(500).render('error',{error:err.message})
        }
    })

    // router.get('/adminpanel',(req,res)=>{
    // res.render('adminpanel')
    // })

    router.get('/add',adminAuth.isLogin,(req,res)=>{
        res.render("add_users")
    })

    router.post('/add', async (req, res) => {
        try {
            let { name, email, password } = req.body;
            console.log("req", req.body);
            const existingUser = await User.findOne({ name: name });
            const existingEmail=await User.findOne({email:email})

            if (existingUser) {
                return res.render('add_users', {
                    alert: { type: "primary", message: "User already exists" }
                });
            }
            else if (existingEmail) {
                return res.render("add_users", {
                    alert: { type: "secondary", message: "User already exists" }
                });
            }
            

            console.log("Password before hashing", req.body.password);
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const insData = new User({
                name,
                email,
                password: hashedPassword
            });

            await insData.save()
                .then(() => {
                    res.redirect('/adminpanel');
                });

        } catch (error) {
            console.log(req.body.password);
            console.error(error);
            console.log(req.body);
            res.status(500).send('Internal Server Error');
        }
    });


    //edit user
    router.get('/edit/:id',adminAuth.isLogin, async (req, res) => {
        try {
            let id = req.params.id;
            let user = await User.findById(id);

            if (user === null) {
                res.redirect('/');
            } else {
                res.render('edituser', { user: user });
            }
        } catch (err) {
            console.error(err);
            res.redirect('/');
        }
    });

    router.post('/update/:id', async (req, res) => {
        try {
            const { name, email, password } = req.body;

            // Validate the data before updating
            // if (!name || !email) {
            //     retu rn res.status(400).send('Name and email are required.');
            // }

            // Check if the new name or email already exists in the database
            const existingUser = await User.findOne({ $and: [{ name: name }, { _id: { $ne: req.params.id } }] });
            const existingEmail = await User.findOne({ $and: [{ email: email }, { _id: { $ne: req.params.id } }] });

            if (existingUser) {
                return res.render('add_users', {
                    alert: { type: "primary", message: "User with the same name already exists." }
                });
            } else if (existingEmail) {
                return res.render('add_users', {
                    alert: { type: "secondary", message: "User with the same email already exists." }
                });
            }

            // Hash the password if it exists
            if (password) {
                const saltrounds = 10;
                req.body.password = await bcrypt.hash(password, saltrounds);
            }

            // Update the user with the new data
            await User.findByIdAndUpdate(req.params.id, req.body);

            // Redirect or render the appropriate view
            const users = await User.find();
            res.render('adminpanel', { users });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server Error');
        }
    });



    //delete user data
    router.get('/delete/:id',adminAuth.isLogin, async (req, res) => {
        try {
            await User.findByIdAndDelete(req.params.id);
            if(req.session.user)
            {
                req.session.user=null;
            }
            res.redirect('/adminpanel')
        } catch (err) {
            console.log("Error deleting user", err);
            res.status(500).render('error', { error: err.message });
        }
    });



    module.exports = router;
