const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");

// Factory function that returns a generic handler to create a single document
exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        const newDoc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data: newDoc
            }
        });
    });

// Factory function that returns a generic handler to update a single document
exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {
        const docID = req.params.id;

        const doc = await Model.findByIdAndUpdate(docID, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        if (!doc) {
            return next(new AppError('No document found with this ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

// Factory function that returns a generic handler to delete a single document
exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const docID = req.params.id;
        const doc = await Model.findByIdAndDelete(docID);

        if (!doc) {
            return next(new AppError('No document found with this ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    });

// Factory function that returns a generic handler to fetch a single document
// -can accept options object specifying the fields to be populated
// -object structure example { path: 'reviews', select?: 'name' }
exports.getOne = (Model, populateOptions) =>
    catchAsync(async (req, res, next) => {
        const docID = req.params.id;
        let query = Model.findById(docID);

        if (populateOptions) query = query.populate(populateOptions);

        const doc = await query;

        if (!doc) {
            return next(new AppError('No document found with this ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

// Factory function that returns a generic handler to fetch all document from given collection
exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        // To allow nested GET reviews on tour
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId};

        // Build the query
        const features = new APIFeatures(Model.find(filter), req.query);
        features
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // Execute the query
        const docs = await features.query;

        // Send response
        res.status(200).json({
            status: 'success',
            results: docs.length,
            data: {
                data: docs
            }
        });
    });