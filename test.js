const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  country: String,
  city: String,
  location: Object,
  students: Array,
  longitude: Number,
  latitude: Number,
  allDif: Number,
}, { collection : 'tests' })

const fileSchema = new mongoose.Schema({
  country: String,
  overallStudents: Number,
}, { collection : 'files' })

const newFileSchema = new mongoose.Schema({
  id: String,
  allDif: Array,
  count: Number,
  longitude: Array,
  latitude: Array,
}, { collection : 'newFiles' })

mongoose.connect('mongodb://localhost:27017/tests', {useNewUrlParser: true, useUnifiedTopology: true, dbName: "tests", useFindAndModify: false});

const Test = mongoose.model('test', userSchema);
const File = mongoose.model('file', fileSchema )
const NewFile = mongoose.model('newFiles', newFileSchema )




// Extract longitude and latitude from ‘location.ll’ in each document and add them to the root of the current document
Test.find({ }, (err, res) => {
  if (err) throw new Error('Not found')

  res.forEach(async (el) => {
    let filter = { _id: el._id}
    let longitudeUpdate = {longitude: el.location.ll[0]}
    let latitudeUpdate = {latitude: el.location.ll[1]}

    await Test.findByIdAndUpdate(filter, longitudeUpdate);
    await Test.findByIdAndUpdate(filter, latitudeUpdate);

  })
})

//4. find document from the second collection by country respectively and count difference between overall students count and current students count 
Test.find({ }, async (err, collection) => {
  if (err) throw new Error('Not found');

  collection.forEach( async (el) => {
      let arrStudents = el.students;
      let sum = 0;

      arrStudents.forEach(eachYear => {
        sum = sum + eachYear.number
      })

      let countryFromSecondFile = await File.find({country:el.country})
      
      countryFromSecondFile.forEach(el => {
        sum = sum - el.overallStudents;
      });
      
    let filter = { _id: el._id}
    let update = {allDif: sum}
    let test =  await Test.findByIdAndUpdate(filter, update);
  })
})

// 5. Find documents count by countries
// 6. Write result to third collection to the current database
File.find({}, (err, res) => {
  if(err) throw new Error('not found')
  
  res.forEach(el => {
    let id = '';
    let allDif = [];
    let count = 0;
    let longitude = [];
    let latitude = [];

    Test.find({country: el.country}, async (err, arraEachCountry) => {
      if(err) throw new Error;
     
      arraEachCountry.forEach( (eachCountry) => {
        id = eachCountry.country;
        allDif.push(eachCountry.allDif);
        count += 1;
        longitude.push(eachCountry.longitude);
        latitude.push(eachCountry.latitude);
      })
        const newFile = new NewFile({ id, allDif, count, longitude, latitude });
        await newFile.save();
    })

  })
})

// mongoose.disconnect()