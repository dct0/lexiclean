const express = require('express');
const router = express.Router();
const Text = require('../models/Text');
const mongoose = require('mongoose');

// NEED INSERT MANY SO WE CAN SLAP X DOCS INTO DATA COLLECTION
router.post('/upload', async (req, res) => {
    console.log('Uploading texts')
    
    // tokens is an array of objects
    const texts = req.body.texts;
    console.log(texts);

    // Will need to load the map and use it to markup fields on the tokens (this will be done in another route)

    try{
        const response = await Text.insertMany(texts)
        res.json(response);
    }catch(err){
        res.json({ message: err })
    }
})

// get single text
router.get('/:textId', async (req, res) => {

    try{
        const response = await Text.findOne({ _id: req.params.textId})
                                    .populate('tokens.token');
        res.json(response);
    }catch(err){
        res.json({ message: err })
    }
})

// get all texts
router.get('/', async (req, res) => {

    try{
        const response = await Text.find()
                                    .populate('tokens.token');
        res.json(response);
    }catch(err){
        res.json({ message: err })
    }
})


// GET DATA FILTERED BY PROJECT ID
// router.get('/:projectId', async (req, res) => {
//     console.log('Fetching data using project id');
    
//     try {
//         const data = await Data.find({ project_id: req.params.projectId });
//         res.json(data);
//     }catch(err){
//         res.json({ message: err})
//     }
// })


// PAGINATE DATA FILTERED BY PROJECT ID
// If any issues arise with results - refer to: https://github.com/aravindnc/mongoose-aggregate-paginate-v2/issues/18
// TODO: Add sort functionality (this will require patching data with annotated status when results are patched)
router.get('/:projectId/filter/', async (req, res) => {
    console.log('Paginating through texts');
    console.log(req.query);
    try {

        // Get 

        // Paginate Aggregation
        // Note: cannot use .populate() on the aggregatePaginate so need to use $lookup instead to populate tokens field
        const textAggregation = Text.aggregate([
            {
                $match: { project_id: mongoose.Types.ObjectId(req.params.projectId)}
            },
            {
                $lookup: {
                    from: 'tokens', // need to use MongoDB collection name - NOT mongoose model name
                    localField: 'tokens.token',
                    foreignField: '_id',
                    as: 'tokens_detail'
                }
            },
            // Merges data in text model and that retrieved from the tokens collection into single object
            {
                $project: {
                    annotated: "$annotated",
                    tokens: {
                        $map : {
                            input: { $zip: { inputs: [ "$tokens", "$tokens_detail"]}},
                            as: "el",
                            in: {
                                $mergeObjects: [{"$arrayElemAt": [ "$$el", 0 ]}, {"$arrayElemAt": [ "$$el", 1 ] }]
                                }
                            }
                        }
                    }
            }
            // {
            //     $sort: {'annotated': 1}
            // },
        ])

        const options = {page: req.query.page, limit: req.query.limit}
        const response = await Text.aggregatePaginate(textAggregation, options);
        res.json(response);
        
    }catch(err){
        res.json({ message: err })
    }
})


// Patch one token
// router.post('/one/:tokenId', async (req, res) => {
//     try{
//         const response = await Data.find({"tokens._id": req.params.tokenId})
        
//         const tokenInfo = response[0].tokens.filter(token => token._id == req.params.tokenId)[0];
//         console.log(tokenInfo);
//         // Update token information
//         console.log(req.body.field, req.body.value)
//         const field = req.body.field;
//         const value = req.body.value;
//         // Note spreading response will give ALL the meta data too, so need to acces just the doc
//         const tokenInfoUpdated = {...tokenInfo._doc, [field]: value}
//         console.log(tokenInfoUpdated)

//         // TODO: update model with new information...
//         // const updatedReponse = await Data.updateOne({"tokens._id": req.params.tokenId}, })
        

//         res.json(response);
//     }catch(err){
//         res.json({ message: err })
//     }
// })

// Get one token
// router.get('/one/:tokenId', async (req, res) => {
//     try{
//         const response = await Data.find({"tokens._id": req.params.tokenId})
//         console.log(response);
//         const tokenInfo = response[0].tokens.filter(token => token._id == req.params.tokenId)[0];
//         console.log(tokenInfo);
//         res.json(tokenInfo)
//     }catch(err){
//         res.json({ message: err })
//     }
// })


// **********************************************************************



module.exports = router;