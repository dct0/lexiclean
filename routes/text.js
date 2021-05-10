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


// Get number of annotated documents
router.get('/progress/:projectId', async (req, res) => {
    console.log('Getting progress');
    try{
        const textsAnnotated = await Text.find({ project_id: req.params.projectId, annotated: true}).count();
        const textsTotal = await Text.find({project_id: req.params.projectId}).count();
        res.json({
            "annotated": textsAnnotated,
            "total": textsTotal
        })
    }catch(err){
        res.json({ message: err })
    }
})






// Get number of total pages for paginator
router.get('/filter/pages/:projectId', async (req, res) => {
    console.log('getting number of pages for paginator')
    try{
        const textsCount = await Text.find({ project_id : req.params.projectId}).count();
        const pages = Math.ceil(textsCount/req.query.limit);
        res.json({"totalPages": pages})
    }catch(err){
        res.json({ message: err })
    }
})


// PAGINATE DATA FILTERED BY PROJECT ID
// If any issues arise with results - refer to: https://github.com/aravindnc/mongoose-aggregate-paginate-v2/issues/18
// TODO: Add sort functionality (this will require patching data with annotated status when results are patched)
router.get('/filter/:projectId', async (req, res) => {
    console.log('Paginating through texts');
    // console.log(req.query);
    try {

        const skip = parseInt((req.query.page - 1) * req.query.limit)
        const limit = parseInt(req.query.limit)

        console.log(skip, limit);


        // Paginate Aggregation
        const textAggregation = await Text.aggregate([
            {
                $match: { 
                    project_id: mongoose.Types.ObjectId(req.params.projectId), 
                    // annotated: false
                }
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
                    candidates: "$candidates",
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
            },
            // To sort data based on the number of replacement candidates e.g. those that are not ds, en, abrv, unsure, etc.
            // First need to addField aggregated over these fields and then sort descending using the calculated field 
            {
                $addFields: {
                    candidates_bool: "$tokens.english_word"
                }
            },
            {
                $project:
                {
                    annotated: "$annotated",
                    tokens: "$tokens",
                    candidates: {
                        $map: {
                            input: "$candidates_bool",
                            as: "candidate",
                            in: {$cond: {if: "$$candidate", then: 0, else: 1}}  // 1 if not english word else 0 
                        }
                    }
                }
            },
            {
                $addFields: {
                    candidate_count: {$sum: "$candidates"}
                }
            },
            // Sort based on the number of candidates
            // Note doing sequential sorts just overrides the n-1 sort operation.
            // TODO: also sort by the first token alphabetically.
            // 
            {
                $sort: {'candidate_count': -1, 'annotated': 1} // -1 descending, 1 ascending
            },
            // {
            //     $sort: {'annotated': 1} // -1 descending, 1 ascending
            // },
            // Paginate over documents
            {
                $skip: skip // equiv to page
            },
            {
                $limit: limit // same as limit
            }

        ])
        .allowDiskUse(true)
        .exec();

        res.json(textAggregation);


        // const response = await Text.aggregatePaginate(textAggregation, options);
        // res.json(response);
        
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