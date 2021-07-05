import db from "../databaseInstance";

class Post{

     static async addPost(userid , word , language , example){
        const sql = await db.getConnection();

        const WORD_DML = `
        INSERT INTO Post (userid , word , language ) VALUES (? , ? , ?);
        `;
        const EXAMPLE_DML = `
        INSERT INTO Example (postid , example) VALUES (? , ?);
        `;

        try{
            await sql.beginTransaction();

            const post_response = await sql.query(WORD_DML , [userid,word,language]);
            const postid = post_response[0].insertId;

            await sql.query(EXAMPLE_DML , [postid , example]);
            await sql.commit();

        }catch(error){
            console.log("add post ERROR" , error);
            await sql.rollback();
        }finally{
            return sql.release();
        }
    } 


    static getPost(userid){
        const QUERY  = `SELECT p.id as postid,word,example,language , e.id as exampleid
                        FROM Post as p , Example as e 
                        WHERE p.id = e.postid and p.userid = ?;`;
        
        return db.query(QUERY, [userid]);
    }
    

    static async addAnotherExample(postid,userid,example,exampleid){
        
        const CHECK_FOR_USER = `SELECT userid FROM Post WHERE id=? AND userid=?`
        const INSERT_EXAMPLE = `INSERT INTO Example (postid , example) VALUES (? , ?);`
        const INSERT_EXAMPLE_ADDED = `INSERT INTO ExampleAdded (userid , exampleid) VALUES (?,?);`

        const sql = await db.getConnection();

        try {
            await sql.beginTransaction();

            const post  = await sql.query(CHECK_FOR_USER , [postid , userid]);
            
            if(!post[0][0]) throw new Error('User not allowed to add an example');

            await sql.query(INSERT_EXAMPLE , [postid , example]);
            await sql.query(INSERT_EXAMPLE_ADDED , [userid , exampleid]);
            await sql.commit();
        } catch (error) {
            console.log(error);
            await sql.rollback();
            throw new Error(error);
        }finally{
            return sql.release();
        }

    }


    static async findOtherExamples(word,userid){
        const OTHER_EXAMPLES = `
            SELECT 
            word,example, p.id as postid , photoURL as userimage, username,upvote,language,e.id as exampleid
            FROM Post as p , User as u , Example as e
            WHERE 
            p.userid = u.id AND
            p.id = e.postid
            AND p.word = ?
            AND p.userid <> ?
            ORDER BY p.upvote DESC;
        `;

        return db.query(OTHER_EXAMPLES , [word,userid]);
    }



    static async deleteYourPost(postid, userid){
        const DELETE_QUERY = `
            DELETE FROM Post
            WHERE id = ? and userid = ?
        `;
        return db.query(DELETE_QUERY , [postid,userid]);
    }

    static async addUpvote(userid,postid){
        const ADD_UPVOTE = `
        INSERT INTO UpVote
        (userid,postid)
        VALUES (?,?);
        `;

        const INCREMENT_UPVOTE = `
        UPDATE Post
        SET upvote = upvote+1
        WHERE id = ?
        `;

        const sql = await db.getConnection();

        try {
            await sql.beginTransaction();
            await sql.query(ADD_UPVOTE , [userid,postid]);
            await sql.query(INCREMENT_UPVOTE , [postid]);
            await sql.commit();
        } catch (error) {
            await sql.rollback();
            throw Error(error);
        }finally{
            return sql.release();
        }
    }

    static async deleteUpvote(userid,postid){
        const REMOVE_UPVOTE = `
        DELETE FROM UpVote
        WHERE 
        userid = ? AND postid = ?;
        `;

        const DECREMENT_UPVOTE = `
        UPDATE Post
        SET upvote = upvote - 1
        WHERE id = ?;
        `;
        const sql = await db.getConnection();
        
        try {
            await sql.beginTransaction();
            await sql.query(REMOVE_UPVOTE , [userid,postid]);
            await sql.query(DECREMENT_UPVOTE , [postid]);
            await sql.commit();
        } catch (error) {
            await sql.rollback();
            throw Error(error);
        }finally{
            return sql.release();
        }
    }

    static async isLiked(userid,postid){
        const ISLIKED_QUERY = `
          SELECT postid 
          FROM UpVote 
          WHERE userid = ? 
          AND postid = ?  
        `;
        return db.query(ISLIKED_QUERY , [userid,postid]);
    }

    static async checkIfExampleAdded(userid , exampleid){        
        const EXAMPLE_ADDED_QUERY = `SELECT userid FROM ExampleAdded WHERE userid=? AND exampleid=?`;
        return db.query(EXAMPLE_ADDED_QUERY , [userid,exampleid]);
    }
}

export default Post;